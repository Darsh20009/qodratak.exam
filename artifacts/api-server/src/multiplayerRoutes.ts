import { Router, Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { GameRoom } from './mongodb/models';
import { requireAdmin, requireAuth } from './middleware/rbac';

const router = Router();
const ROOM_CODE_RE = /^[A-Z0-9]{6}$/;

function roomCode(value: unknown): string | null {
  return typeof value === 'string' && ROOM_CODE_RE.test(value.toUpperCase()) ? value.toUpperCase() : null;
}

function sessionUserId(req: Request): string | null {
  const session = req.session as any;
  const userId = session?.userId || (session?.isAdmin ? session.adminId : undefined);
  return typeof userId === 'string' && /^[a-fA-F0-9]{24}$/.test(userId) ? userId : null;
}

function requireRoomCreator(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (session?.isAdmin && typeof session.adminId === 'string' && /^[a-fA-F0-9]{24}$/.test(session.adminId)) {
    return next();
  }
  return requireAuth(req, res, next);
}

function optionalText(value: unknown, fallback: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return fallback;
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength ? value.trim() : null;
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined || value === null) return fallback;
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

// ── GENERATE ROOM CODE ────────────────────────────────────────────────────────
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── CREATE GAME ROOM ──────────────────────────────────────────────────────────
router.post('/rooms', requireRoomCreator, async (req: Request, res: Response) => {
  try {
    const { hostUsername, title, questions, timePerQuestion, isPublicEvent, maxParticipants } = req.body;
    const hostUserId = sessionUserId(req);

    if (!hostUserId || !Array.isArray(questions) || questions.length < 2 || questions.length > 100 ||
      (isPublicEvent !== undefined && typeof isPublicEvent !== 'boolean')) {
      return res.status(400).json({ error: 'بيانات غير مكتملة' });
    }
    if (isPublicEvent) {
      return requireAdmin(req, res, async () => {
        await createRoom(req, res, hostUserId, hostUsername, title, questions, timePerQuestion, isPublicEvent, maxParticipants);
      });
    }
    await createRoom(req, res, hostUserId, hostUsername, title, questions, timePerQuestion, isPublicEvent, maxParticipants);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'فشل إنشاء الغرفة' });
  }
});

async function createRoom(req: Request, res: Response, hostUserId: string, hostUsername: unknown, title: unknown, questions: any[], timePerQuestion: unknown, isPublicEvent: unknown, maxParticipants: unknown) {
  try {
    const safeHostUsername = optionalText(hostUsername, 'مضيف', 100);
    const safeTitle = optionalText(title, 'اختبار جماعي', 200);
    const safeTimePerQuestion = boundedInteger(timePerQuestion, 30, 5, 300);
    const safeMaxParticipants = boundedInteger(maxParticipants, 50, 2, 500);
    if (!safeHostUsername || !safeTitle || safeTimePerQuestion === null || safeMaxParticipants === null) {
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    }
    let code = generateCode();
    while (await GameRoom.findOne({ code, status: { $ne: 'finished' } })) {
      code = generateCode();
    }

    const room = await GameRoom.create({
      code,
      hostUserId,
      hostUsername: safeHostUsername,
      title: safeTitle,
      questions,
      questionCount: questions.length,
      timePerQuestion: safeTimePerQuestion,
      isPublicEvent: isPublicEvent === true,
      maxParticipants: safeMaxParticipants,
      status: 'waiting',
      participants: [],
    });

    res.json({ success: true, room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'فشل إنشاء الغرفة' });
  }
}

// ── GET ROOM BY CODE ──────────────────────────────────────────────────────────
router.get('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const code = roomCode(req.params.code);
    if (!code) return res.status(400).json({ error: 'رمز الغرفة غير صالح' });
    const room = await GameRoom.findOne({ code });
    if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب الغرفة' });
  }
});

// ── GET ACTIVE PUBLIC EVENTS ──────────────────────────────────────────────────
router.get('/events', async (req: Request, res: Response) => {
  try {
    const events = await GameRoom.find({
      isPublicEvent: true,
      status: { $in: ['waiting', 'starting'] }
    }).sort({ createdAt: -1 }).limit(10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب الأحداث' });
  }
});

// ── GET ROOM RESULTS ──────────────────────────────────────────────────────────
router.get('/rooms/:code/results', async (req: Request, res: Response) => {
  try {
    const code = roomCode(req.params.code);
    if (!code) return res.status(400).json({ error: 'رمز الغرفة غير صالح' });
    const room = await GameRoom.findOne({ code, status: 'finished' });
    if (!room) return res.status(404).json({ error: 'لا توجد نتائج' });
    
    const sorted = [...room.participants].sort((a, b) => b.score - a.score);
    res.json({ room, leaderboard: sorted });
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب النتائج' });
  }
});

// ── CREATE SCHEDULED STUDY ROOM ───────────────────────────────────────────────
router.post('/scheduled', requireRoomCreator, async (req: Request, res: Response) => {
  try {
    const { hostUsername, title, questions, timePerQuestion, maxParticipants, scheduledAt, category } = req.body;
    const hostUserId = sessionUserId(req);
    if (!hostUserId || typeof scheduledAt !== 'string') return res.status(400).json({ error: 'بيانات غير مكتملة' });
    const schedDate = new Date(scheduledAt);
    const safeHostUsername = optionalText(hostUsername, 'مضيف', 100);
    const safeTitle = optionalText(title, 'غرفة دراسة جماعية', 200);
    const safeTimePerQuestion = boundedInteger(timePerQuestion, 30, 5, 300);
    const safeMaxParticipants = boundedInteger(maxParticipants, 20, 2, 500);
    if (!safeHostUsername || !safeTitle || safeTimePerQuestion === null || safeMaxParticipants === null ||
      (questions !== undefined && !Array.isArray(questions)) ||
      (category !== undefined && !['mixed', 'verbal', 'quantitative'].includes(category))) {
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    }
    if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
      return res.status(400).json({ error: 'يجب أن يكون الوقت في المستقبل' });
    }
    let code = generateCode();
    while (await GameRoom.findOne({ code, status: { $ne: 'finished' } })) { code = generateCode(); }
    const room = await GameRoom.create({
      code, hostUserId,
       hostUsername: safeHostUsername,
       title: safeTitle,
      questions: questions || [],
      questionCount: (questions || []).length || 10,
       timePerQuestion: safeTimePerQuestion,
      isPublicEvent: false,
       maxParticipants: safeMaxParticipants,
      status: 'waiting',
      participants: [],
      isScheduled: true,
      scheduledAt: schedDate,
      category: category || 'mixed',
    });
    res.json({ success: true, room });
  } catch (error) {
    console.error('Create scheduled room error:', error);
    res.status(500).json({ error: 'فشل إنشاء الغرفة' });
  }
});

// ── LIST UPCOMING SCHEDULED ROOMS ─────────────────────────────────────────────
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const rooms = await GameRoom.find({
      isScheduled: true,
      status: { $in: ['waiting', 'starting', 'playing'] },
      scheduledAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // include rooms up to 2h past
    }).sort({ scheduledAt: 1 }).limit(50);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب الغرف' });
  }
});

// ── REGISTER FOR A SCHEDULED ROOM ─────────────────────────────────────────────
router.post('/scheduled/:code/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, avatar } = req.body;
    const userId = sessionUserId(req);
    const code = roomCode(req.params.code);
    if (!userId || !code || (username !== undefined && (typeof username !== 'string' || username.length > 100)) ||
      (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 2048))) {
      return res.status(400).json({ error: 'بيانات غير مكتملة' });
    }
    const room = await GameRoom.findOne({ code, isScheduled: true, status: { $in: ['waiting', 'starting'] } });
    if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة أو انتهت' });
    if (room.participants.length >= room.maxParticipants) {
      const alreadyIn = room.participants.find((p: any) => p.userId === userId);
      if (!alreadyIn) return res.status(400).json({ error: 'الغرفة ممتلئة' });
    }
    const result = await GameRoom.updateOne(
      { code, isScheduled: true, 'participants.userId': { $ne: userId } },
      { $push: { participants: { userId, username: username || 'مشارك', avatar: avatar || '', score: 0, answers: [], joinedAt: new Date(), isReady: false, isOnline: true } } }
    );
    if (result.modifiedCount === 0) {
      const existing = await GameRoom.findOne({ code });
      return res.json({ success: true, room: existing });
    }
    const updated = await GameRoom.findOne({ code });
    res.json({ success: true, room: updated });
  } catch (error) {
    res.status(500).json({ error: 'فشل التسجيل' });
  }
});

// ── UNREGISTER FROM A SCHEDULED ROOM ──────────────────────────────────────────
router.delete('/scheduled/:code/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    const code = roomCode(req.params.code);
    if (!userId || !code) return res.status(400).json({ error: 'بيانات غير مكتملة' });
    await GameRoom.updateOne({ code }, { $pull: { participants: { userId } as any } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل إلغاء التسجيل' });
  }
});

export default router;

// ── GAME WEBSOCKET SERVER ─────────────────────────────────────────────────────
interface GameClient extends WebSocket {
  userId?: string;
  username?: string;
  roomCode?: string;
  isAlive?: boolean;
}

export class GameWebSocketServer {
  wss: WebSocketServer | null = null;
  private roomClients: Map<string, Set<GameClient>> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws: GameClient) => {
      ws.isAlive = true;

      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());
          await this.handleMessage(ws, msg);
        } catch (err) {
          console.error('Game WS error:', err);
        }
      });

      ws.on('close', async () => {
        if (ws.roomCode && ws.userId) {
          const clients = this.roomClients.get(ws.roomCode);
          if (clients) {
            clients.delete(ws);
            if (clients.size === 0) this.roomClients.delete(ws.roomCode);
          }
          await GameRoom.updateOne(
            { code: ws.roomCode, 'participants.userId': ws.userId },
            { $set: { 'participants.$.isOnline': false } }
          );
          this.broadcastToRoom(ws.roomCode, { type: 'participant_disconnected', userId: ws.userId });
        }
      });

      ws.on('error', (err) => console.error('GameWS client error:', err));
    });

    const heartbeat = setInterval(() => {
      this.wss?.clients.forEach((ws: GameClient) => {
        if (!ws.isAlive) { ws.terminate(); return; }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => clearInterval(heartbeat));
    console.log('🎮 Game WebSocket server initialized');
  }

  private async handleMessage(ws: GameClient, msg: any) {
    switch (msg.type) {
      case 'join_room': {
        const { code, userId, username } = msg;
        const safeCode = roomCode(code);
        if (!safeCode || typeof userId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(userId) ||
          (username !== undefined && (typeof username !== 'string' || username.length > 100))) {
          ws.send(JSON.stringify({ type: 'error', message: 'بيانات الانضمام غير صالحة' }));
          return;
        }
        const room = await GameRoom.findOne({ code: safeCode });
        if (!room) { ws.send(JSON.stringify({ type: 'error', message: 'الغرفة غير موجودة' })); return; }
        if (room.status === 'finished') { ws.send(JSON.stringify({ type: 'error', message: 'انتهى الاختبار' })); return; }

        ws.userId = userId;
        ws.username = username;
        ws.roomCode = room.code;

        if (!this.roomClients.has(room.code)) this.roomClients.set(room.code, new Set());
        this.roomClients.get(room.code)!.add(ws);

        const result = await GameRoom.updateOne(
          { code: room.code, 'participants.userId': { $ne: userId } },
          { $push: { participants: { userId, username: username || 'طالب', score: 0, answers: [], joinedAt: new Date(), isReady: false, isOnline: true } } }
        );
        if (result.modifiedCount === 0) {
          await GameRoom.updateOne(
            { code: room.code, 'participants.userId': userId },
            { $set: { 'participants.$.isOnline': true, 'participants.$.username': username || 'طالب' } }
          );
        }

        const updated = await GameRoom.findOne({ code: room.code });
        ws.send(JSON.stringify({ type: 'joined', room: updated }));
        this.broadcastToRoom(room.code, { type: 'participant_joined', userId, username, participants: updated?.participants }, ws);
        break;
      }

      case 'ready': {
        if (!ws.roomCode || !ws.userId) return;
        await GameRoom.updateOne(
          { code: ws.roomCode, 'participants.userId': ws.userId },
          { $set: { 'participants.$.isReady': true } }
        );
        const updated = await GameRoom.findOne({ code: ws.roomCode });
        this.broadcastToRoom(ws.roomCode, { type: 'participant_ready', userId: ws.userId, participants: updated?.participants });
        break;
      }

      case 'start_game': {
        if (!ws.roomCode) return;
        const room = await GameRoom.findOne({ code: ws.roomCode });
        if (!room || room.hostUserId !== ws.userId) {
          ws.send(JSON.stringify({ type: 'error', message: 'فقط المضيف يمكنه بدء الاختبار' }));
          return;
        }

        await GameRoom.updateOne({ code: ws.roomCode }, { status: 'starting', startedAt: new Date() });
        this.broadcastToRoom(ws.roomCode, { type: 'game_starting', countdown: 3 });

        setTimeout(async () => {
          await GameRoom.updateOne({ code: ws.roomCode! }, { status: 'playing', currentQuestion: 0 });
          const updated = await GameRoom.findOne({ code: ws.roomCode! });
          if (!updated) return;
          const q = updated.questions[0];
          this.broadcastToRoom(ws.roomCode!, {
            type: 'question',
            questionIndex: 0,
            question: { text: q.text, options: q.options },
            timeLimit: updated.timePerQuestion,
            total: updated.questions.length,
          });
          this.scheduleNextQuestion(ws.roomCode!, 0, updated.timePerQuestion);
        }, 3000);
        break;
      }

      case 'answer': {
        if (!ws.roomCode || !ws.userId) return;
        const { questionIndex, selectedAnswer, timeMs } = msg;
        const room = await GameRoom.findOne({ code: ws.roomCode });
        if (!room || room.currentQuestion !== questionIndex) return;

        const q = room.questions[questionIndex];
        const isCorrect = q.correctAnswer === selectedAnswer;
        const points = isCorrect ? Math.max(10, Math.round(10 + (room.timePerQuestion * 1000 - timeMs) / 500)) : 0;

        const participant = room.participants.find(p => p.userId === ws.userId);
        if (participant?.answers.some(a => a.questionIndex === questionIndex)) return;

        await GameRoom.updateOne(
          { code: ws.roomCode, 'participants.userId': ws.userId },
          {
            $push: { 'participants.$.answers': { questionIndex, selectedAnswer, isCorrect, timeMs } },
            $inc: { 'participants.$.score': points }
          }
        );

        ws.send(JSON.stringify({ type: 'answer_result', questionIndex, isCorrect, points, correctAnswer: q.correctAnswer }));

        const updated = await GameRoom.findOne({ code: ws.roomCode });
        const scores = updated?.participants.map(p => ({ userId: p.userId, username: p.username, score: p.score })).sort((a, b) => b.score - a.score);
        this.broadcastToRoom(ws.roomCode, { type: 'scores_update', scores });
        break;
      }
    }
  }

  private scheduleNextQuestion(roomCode: string, currentIndex: number, timePerQuestion: number) {
    setTimeout(async () => {
      const room = await GameRoom.findOne({ code: roomCode });
      if (!room || room.status !== 'playing') return;

      const nextIndex = currentIndex + 1;
      if (nextIndex >= room.questions.length) {
        await GameRoom.updateOne({ code: roomCode }, { status: 'finished', endedAt: new Date() });
        const final = await GameRoom.findOne({ code: roomCode });
        const leaderboard = [...(final?.participants || [])].sort((a, b) => b.score - a.score);
        this.broadcastToRoom(roomCode, { type: 'game_over', leaderboard });
        return;
      }

      const q = room.questions[nextIndex];
      await GameRoom.updateOne({ code: roomCode }, { currentQuestion: nextIndex });
      this.broadcastToRoom(roomCode, {
        type: 'question',
        questionIndex: nextIndex,
        question: { text: q.text, options: q.options },
        timeLimit: room.timePerQuestion,
        total: room.questions.length,
      });
      this.scheduleNextQuestion(roomCode, nextIndex, timePerQuestion);
    }, (timePerQuestion + 3) * 1000);
  }

  private broadcastToRoom(roomCode: string, data: any, exclude?: GameClient) {
    const clients = this.roomClients.get(roomCode);
    if (!clients) return;
    const serialized = JSON.stringify(data);
    clients.forEach(client => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  }
}

export const gameWebSocketServer = new GameWebSocketServer();
