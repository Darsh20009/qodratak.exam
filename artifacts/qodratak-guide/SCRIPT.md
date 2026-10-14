# كيف تستخدم قدراتك — فيلم إرشادي 16:9 (72 ث، 16 مشهدًا)

Treatment unchanged: deep navy stage #0D1B2A, coral #FF8A70, mint #91D7C5, paper #F7F4EE; Tajawal 900 + IBM Plex Sans Arabic. Real student screens, now inside a browser-window frame (traffic dots + qodratak.sa/<route> bar). Camera push-in, typewriter captions, outlined step numerals (reduced to 38vmin), and — new — sequential coral callout pins with navy labels on exam screens. Three chapters shown in the step eyebrow: التعلّم / التدريب والاختبارات / المتابعة. Ending: official logo (qodratak-logo-transparent.png) on paper field.

Shots: old captures (crop 6.6% dev strip): student-dashboard, preparation-course, today, foundation, computerized, results, account. New captures (n-*.jpg, 1600x900, synthetic student, no submission): n-book, n-mock, n-exam-instr, n-exam-answer, n-exam-q2, n-custom, n-support.

| # | Start | Dur | Key | Label | Line 1 / Line 2 | Layout | Callouts |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 4.5 | intro | — | دليلك السريع / كيف تستخدم قدراتك؟ | icon + framed landing | — |
| 2 | 4.5 | 4.5 | dashboard | ١ لوحتي | هنا تبدأ كل يوم | right | ring |
| 3 | 9 | 4 | course | ٢ دورتي | هنا تحجز موعد اختبارك | left | ring |
| 4 | 13 | 4 | today | ٣ مهام اليوم | هنا مهامك اليومية | full | ring |
| 5 | 17 | 4 | foundation | ٤ التأسيس | هنا تتعلّم من الأساس | right | ring |
| 6 | 21 | 4 | book | ٥ كتاب التأسيس | هنا تقرأ الشرح خطوة بخطوة | left | ring |
| 7 | 25 | 4.5 | computerized | ٦ المحوسب | بنوك أسئلة ودروس منشورة | full | ring |
| 8 | 29.5 | 5 | mock | ٧ الاختبارات المحاكية | لفظي ٦٥، كمي ٥٥، شامل ١٢٠ | right | 3 pins 1.6/2.3/3.0s |
| 9 | 34.5 | 5 | instructions | ٨ قبل البدء | محاكاة بمراقبة أو تدريب بدون مراقبة | left | 3 pins |
| 10 | 39.5 | 6 | runner | ٩ داخل الاختبار | سؤال واحد في كل شاشة، والمؤقت أمامك | full | timer, answer, map, mark-for-review |
| 11 | 45.5 | 4.5 | passage | ١٠ أسئلة القطعة | اقرأ القطعة ثم «حفظ والتالي» | right | 2 pins |
| 12 | 50 | 4 | custom | ١١ اختبار مخصص | عدد أسئلة اللفظي والكمي والوقت | left | ring |
| 13 | 54 | 4.5 | results | ١٢ نتائجي | نتائج تدريبية داخل المنصة، وليست درجة قياس الرسمية | right | ring |
| 14 | 58.5 | 4 | account | ١٣ حسابي | بياناتك واشتراكك | full | ring |
| 15 | 62.5 | 4 | support | ١٤ الدعم | الأسئلة الشائعة والدعم | left | ring |
| 16 | 66.5 | 5.5 | outro | — | خطوة واحدة كل يوم → official logo | mosaic → paper | — |

## Continuity revision (transitions)
- One persistent browser window (BrowserStage, outside AnimatePresence) lives for the whole film; it never unmounts, so there are no blank navy frames between pages.
- Poses (transform-only, fixed 58%-wide 16:9 window): intro = lower third peeking (rises at 1.5s); right layout = x 37% y 12%; left = x 5% y 12%; full = x 21% y 4%; outro = centered, fades 0.25-0.7s as the mosaic arrives.
- Every scene boundary: window glides to the next pose (0.95s, ease 0.65/0/0.35/1) while the new screenshot cross-dissolves over the old inside the frame (0.55s in, old held 0.25s then out) and the URL slides up to the new route. Caption column and outline numeral fade/drift (0.4-0.8s) on the shared navy + grain backdrop.
- Removed: per-scene rotateY card flips, scale-0.9 entrances, whole-scene navy fades, intro card zoom-out.

Audio: bg_music_full.mp3 (73.0 s) premixed from the original 46 s bg_music.mp3: two copies joined with a 6 s triangular crossfade around 40-46 s, trimmed to 73 s with a 3 s fade-out at 70 s. No new music, no loop attribute; each scene seeks to its absolute film start (SCENE_START_SEC), so the bed runs continuously across the whole 72 s film with no mid-film restart. No VO/SFX.

## Marketing film (?film=marketing) — 36 s, src/components/video/Marketing.tsx
Treatment: same navy/coral/mint/paper identity; hook of scattered "sources" chips that implode into the logo, then one persistent qodratak.sa browser window gliding between left/right/wide poses with timed coral pins.
| Start | Dur | Key | Copy |
|---|---|---|---|
| 0 | 4.5 | m_hook | «سلام!» 22vmin coral greeting 0–1.5 s, then ليه دايمًا مشتّت؟ / مصدر هنا، وملف هناك… (8 chips pop 0.32 s apart, implode on exit) |
| 4.5 | 4 | m_gather | icon spring + ring · جمعنا لك كل مصادرك في مكان واحد · qodratak.sa |
| 8.5 | 4 | m_foundation | ابدأ من الصفر — foundation → n-book |
| 12.5 | 4.5 | m_computerized | لفظي وكمي [محوسب] — computerized → n-mock pins |
| 17 | 6.5 | m_exam | wide: n-exam-instr → n-exam-answer (timer/question/map pins) → n-exam-q2 · محاكاة تقرّبك من تجربة الاختبار |
| 23.5 | 4 | m_results | تعرف وين تغلط — results → n-records (training results) |
| 27.5 | 3.5 | m_plans | كل يوم خطوة [التحصيلي · قريبًا] — dashboard → today |
| 31 | 5 | m_outro | paper aperture · اختار قدراتك… وابدأ بسلام · logo · qodratak.sa · independence/no-guarantee disclaimer |
## Audio spec (marketing)
- Runtime 36 s; generated marketing_music.mp3 (36.05 s): oud/plucks opening, lift at ~8.5 s and big lift at ~17 s (measured RMS -30→-24 dB, -23→-15 dB), fade at 34 s. Cuts at 8.5 and 17 s sit on those lifts. No VO/SFX.
## URL contract
default = full guide · ?film=marketing · ?chapter=KEY (mock = mock+instructions+runner+passage) · ?muted=1.
- Embed legibility pass: critical text sized for 350x197/600x338 embeds (titles 10vmin, lines 5vmin, pins 4.2vmin, URL bar 3.2vmin, disclaimer 4.4vmin).

## Supplemental chapter clips (?chapter=KEY only) — src/components/video/ExtraChapters.tsx
These are not part of the 72 s guide or the 36 s promo. Each clip runs 7.5 s and loops (played as _r1/_r2), uses the existing bg_music_full.mp3 at a fixed offset, and has the same layout: a qodratak.sa/<route> frame on the left, then a title and three numbered points that appear at 1.1/2.4/3.7 s.
Keys → routes: flashcards /flashcards · analysis /performance-report · mistakes /mistake-challenge (EnhancedMistakeChallenge: questions come from a test result you got wrong (stored in localStorage), 6 modes, then percentage/correct/points; without a stored challenge the page sends you to /test-results) · security /security-settings · preexam /pre-exam-day · tutor /ai-tutor · rooms /study-rooms · notifications /notifications.
Labels are copied from the real page sources. Only notifications uses a real screenshot (n-notif.jpg). The other pages require sign-in, so they appear as panels marked «رسم توضيحي من الصفحة», with placeholder values (—) instead of made-up numbers.

## Revision: full platform guide + role guides + personal greeting
URL contract: default / ?film=guide = full student guide · ?film=admin · ?film=institution · ?film=teacher · ?film=marketing and every ?chapter=KEY unchanged.

Personalization (viewer.tsx): parent posts {type:'qodratak.guide.viewer', displayName}; accepted only when event.source===window.parent && event.origin===location.origin. The iframe posts {type:'qodratak.guide.ready'} to the parent at location.origin once the listener is attached. The name is cleaned (control and bidi characters removed, whitespace collapsed, max 32 code points) and shown only as React text in «هلا، name». With no name the greeting is «هلا». Nothing is stored or fetched.

Full student guide, 116 s, 24 scenes: intro (هلا + دليلك الكامل للمنصة + كيف تستخدم قدراتك؟) · 14 original steps unchanged · 8 extra pages as 5.5 s ClipScenes (flashcards, analysis, mistakes, security, preexam, tutor, rooms, notifications; the browser window fades out while they play) · outro 5.5 s. Audio: bg_music_full continuous 0–66.5 s; extras seek once to 4.5 s and play 4.5–48.5 s continuously; the outro seeks back to its original 66.5 s.

Role films (RoleFilms.tsx), with a 4.5 s greeting intro (icon, هلا، name, film title), 6.5 s illustrative clips, and a 5 s paper/logo outro stating that the screens are illustrations with no real data. Audio: bg_music_full continuous from 0.
- admin, 61.5 s, 10 scenes: overview · accounts · subscriptions · question bank and reports · announcements and notifications · support and email · institutions · settings and content.
- institution, 42 s, 7 scenes: board stats · join codes · students and assignment · teachers and revoke · performance reading.
- teacher, 48.5 s, 7 scenes: institution teacher (assigned students, student results) · independent teacher (classes, roster, progress report and CSV). Assignments and messaging are not shown.
All role panels use placeholders (طالب ١, —) and carry the badge «رسم توضيحي من الصفحة».

## Revision: platform rating (x_review) — full guide now 122.5 s, 25 scenes
Inserted at 66.5–73.0 s (6.5 s), straight after step 14 الدعم and before the 8 extra pages. It is also available on its own at ?chapter=review (7.5 s loop).
Source: DashboardPage DashboardHelpDetails, PlatformReviewCard. Frame: qodratak.sa/, eyebrow «لوحتي · أسفل الصفحة», title «قيّم المنصة».
Panel timing: the outer «تقييم المنصة» row is shown; the inner «قيّم المنصة / شاركنا تجربتك» opens at 0.9 s; four of the five stars under «تقييمك من ٥» fill at 2.5–3.0 s. The panel also shows the opinion placeholder, the consent checkbox with its exact text, and the «إرسال التقييم للإدارة» button, which pulses at 3.8 s.
Bullets at 1.1, 2.4 and 3.7 s. The note «يصل رأيك إلى الإدارة أولًا، ولا يظهر في الصفحة الرئيسية إلا بعد اعتمادها» appears at 4.2 s.
The consent box is drawn unticked and is never described as automatic. The panel is marked «رسم توضيحي من الصفحة».
Audio: the bed now runs 4.5–55 s during the extra pages; the outro still seeks to 66.5 s.

## Accuracy fix: rating send step + runtime — full guide now 119.3 s, 25 scenes
The Send button now follows the real rule in PlatformReviewCard: it is enabled only once there is a rating, non-empty text and consent.
Timeline inside x_review (6.5 s), relative to the scene start:
- 0.9 s: the inner «قيّم المنصة» section opens.
- 2.5–3.0 s: four stars fill.
- 3.1 s: the placeholder is replaced by «مثال توضيحي: الشرح واضح، وأتمنى أسئلة أكثر.»
- 3.8 s: the consent box is ticked; the consent wording is unchanged.
- Until 4.1 s the button is dimmed to 40% opacity (disabled). At 4.1 s it becomes enabled, and it pulses at 4.3–4.9 s.
- 4.8 s: the note about review by the administration before publication appears.
Bullet 3 now reads «ضع علامة الموافقة، ثم «إرسال التقييم للإدارة»». Nothing is submitted.
Runtime: the 8 extra pages are 5.1 s each (were 5.5 s). Bed offsets: review 4.5 s, then extras continuous from 11 s at 5.1 s steps. x_review runs 66.5–73.0 s; flashcards starts at 73.0 s.
