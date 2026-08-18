import { Router, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { GameRoom } from './mongodb/models';

const router = Router();

// ── GENERATE ROOM CODE ────────────────────────────────────────────────────────
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── CREATE GAME ROOM ──────────────────────────────────────────────────────────
router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { hostUserId, hostUsername, title, questions, timePerQuestion, isPublicEvent, maxParticipants } = req.body;

    if (!hostUserId || !questions || questions.length < 2) {
      return res.status(400).json({ error: 'بيانات غير مكتملة' });
    }

    let code = generateCode();
    while (await GameRoom.findOne({ code, status: { $ne: 'finished' } })) {
      code = generateCode();
    }

    const room = await GameRoom.create({
      code,
      hostUserId,
      hostUsername: hostUsername || 'مضيف',
      title: title || 'اختبار جماعي',
      questions,
      questionCount: questions.length,
      timePerQuestion: timePerQuestion || 30,
      isPublicEvent: isPublicEvent || false,
      maxParticipants: maxParticipants || 50,
      status: 'waiting',
      participants: [],
    });

    res.json({ success: true, room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'فشل إنشاء الغرفة' });
  }
});

// ── GET ROOM BY CODE ──────────────────────────────────────────────────────────
router.get('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const room = await GameRoom.findOne({ code: req.params.code.toUpperCase() });
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
    const room = await GameRoom.findOne({ code: req.params.code.toUpperCase(), status: 'finished' });
    if (!room) return res.status(404).json({ error: 'لا توجد نتائج' });
    
    const sorted = [...room.participants].sort((a, b) => b.score - a.score);
    res.json({ room, leaderboard: sorted });
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب النتائج' });
  }
});

// ── CREATE SCHEDULED STUDY ROOM ───────────────────────────────────────────────
router.post('/scheduled', async (req: Request, res: Response) => {
  try {
    const { hostUserId, hostUsername, title, questions, timePerQuestion, maxParticipants, scheduledAt, category } = req.body;
    if (!hostUserId || !scheduledAt) return res.status(400).json({ error: 'بيانات غير مكتملة' });
    const schedDate = new Date(scheduledAt);
    if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
      return res.status(400).json({ error: 'يجب أن يكون الوقت في المستقبل' });
    }
    let code = generateCode();
    while (await GameRoom.findOne({ code, status: { $ne: 'finished' } })) { code = generateCode(); }
    const room = await GameRoom.create({
      code, hostUserId,
      hostUsername: hostUsername || 'مضيف',
      title: title || 'غرفة دراسة جماعية',
      questions: questions || [],
      questionCount: (questions || []).length || 10,
      timePerQuestion: timePerQuestion || 30,
      isPublicEvent: false,
      maxParticipants: maxParticipants || 20,
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
router.post('/scheduled/:code/register', async (req: Request, res: Response) => {
  try {
    const { userId, username, avatar } = req.body;
    if (!userId) return res.status(400).json({ error: 'بيانات غير مكتملة' });
    const code = req.params.code.toUpperCase();
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
router.delete('/scheduled/:code/register', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const code = req.params.code.toUpperCase();
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
        const room = await GameRoom.findOne({ code: code.toUpperCase() });
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
