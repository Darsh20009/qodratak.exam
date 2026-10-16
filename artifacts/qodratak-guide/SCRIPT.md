# كيف تستخدم قدراتك — فيلم إرشادي 16:9 (72 ث، 16 مشهدًا)

Treatment unchanged: deep navy stage #0D1B2A, coral #FF8A70, mint #91D7C5, paper #F7F4EE; Tajawal 900 + IBM Plex Sans Arabic. Real student screens, now inside a browser-window frame (traffic dots + qodratak.sa/<route> bar). Camera push-in, typewriter captions, outlined step numerals (reduced to 38vmin), and — new — sequential coral callout pins with navy labels on exam screens. Three chapters shown in the step eyebrow: التعلّم / التدريب والاختبارات / المتابعة. Ending: official logo (qodratak-logo-transparent.png) on paper field.

Shots: old captures (crop 6.6% dev strip): student-dashboard, preparation-course, today, foundation, computerized, results, account. New captures (n-*.jpg, 1600x900, synthetic student, no submission): n-book, n-mock, n-exam-instr, n-exam-answer, n-exam-q2, n-custom, n-support.

| # | Start | Dur | Key | Label | Line 1 / Line 2 | Layout | Callouts |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 4.5 | intro | — | دليلك السريع / كيف تستخدم قدراتك؟ | icon + framed landing | — |
| 2 | 4.5 | 4.5 | dashboard | ١ لوحتي | هنا تبدأ كل يوم | right | ring |
| 3 | 9 | 4 | course | ٢ خطتي | هنا تتابع خطة استعدادك | left | ring |
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

## Marketing route split

The public homepage film route `?film=marketing` retains its established 16:9 legacy composition and gains an explicit Tahsili study path. The approved `?film=marketing-welcome` cut receives the same accurate path. Both stay at 36 s and 8 scenes, keep `marketing_music.mp3`, the player/recording scaffold, and all unaffected shots. The old «التحصيلي · قريبًا» claim is removed.

### Public homepage film (`?film=marketing`) — restored legacy cut, 36 s, 8 scenes

| # / time | Duration | Scene key | On-screen story | Product/screens |
|---|---:|---|---|---|
| 01 · 0–4.5 s | 4.5 s | m_hook | «سلام!» → «ليه دايمًا مشتّت؟» / «مصدر هنا وملف هناك… ووقتك يضيع»; scattered study-source labels converge toward the question. | Navy field; labels for PDF, Telegram, old question bank, YouTube, scattered compilations, unfinished schedule, third-party site, and phone notes. |
| 02 · 4.5–8.5 s | 4 s | m_gather | «جمعنا لك كل مصادرك / في مكان واحد» and qodratak.sa. | Brand icon reveal and expanding mint ring; no browser visible. |
| 03 · 8.5–12.5 s | 4 s | m_foundation | «التأسيس» / «ابدأ من الصفر» / «كمي ولفظي خطوة بخطوة». | Foundation screen, then the quantitative foundation book; right-side copy. |
| 04 · 12.5–17 s | 4.5 s | m_computerized | «المحوسب» / «لفظي وكمي» / «بنوك أسئلة واختبارات محاكية» / «محوسب». | Computerized page then mock-exams page, with original floating labels «لفظي» and «كمي»; left-side copy. |
| 05 · 17–22 s | 5 s | m_exam | «محاكاة تقرّبك من تجربة الاختبار». | Instructions, answer screen, then question 2, with the original timed navy callout tags for simulation mode, timer, question/map, and passage. The final screen begins at +3.33 s and holds through the cut. |
| 06 · 22–25.5 s | 3.5 s | m_results | «التصحيح والنتائج» / «تعرف وين تغلط» / «تصحيح فوري ونتائج تفصيلية». | Original results capture followed by the real records screen; right-side copy. |
| 07 · 25.5–31 s | 5.5 s | m_plans | «مسار التحصيلي» / «ابدأ بالمادة» / «ادرس، طبّق، ثم اختبر جاهزيتك». | Browser at its established right-side pose; an illustrative three-stage screen names the study sequence and the actual Tahsili routes. The obsolete coming-soon label is gone. |
| 08 · 31–36 s | 5 s | m_outro | «اختار قدراتك… وابدأ بسلام» / qodratak.sa / «منصة تدريبية مستقلة غير تابعة لقياس · النتائج تدريبية ولا تضمن درجة». | Paper iris, official logo, mint site lockup and disclaimer; closes to the opening scatter. |

The legacy browser remains a persistent 16:9 frame and retains its original screenshots, crop behavior, floating callout tags, and continuous absolute-offset audio seeks in every unchanged scene. Music is unchanged; scene durations total exactly 36.0 s. The m_plans board is clearly marked «عرض توضيحي لمسار الطالب» rather than presented as a captured student account.

#### Revised legacy shot 07 / 25.5–31.0 s / 5.5 s — «مسار التحصيلي»

Purpose: Replace the false “coming soon” message with the real Tahsili study route, not a launch claim. Exact copy: eyebrow «مسار التحصيلي»; title «ابدأ بالمادة»; line «ادرس، طبّق، ثم اختبر جاهزيتك». Inside the persistent browser, URL is qodratak.sa/student-program/tahsili. The illustrative screen reads «التحصيلي المتكامل» and «مسار الدراسة والتدريب والاختبار»; its three cards read «اختر المادة / رياضيات · فيزياء · كيمياء · أحياء», «ادرس ثم طبّق / مركز الدراسة والشرح، ثم بنك الأسئلة», and «اختبر جاهزيتك / حسب المادة · مخصص · شامل». Lower route labels read «شرح المادة · بنك الأسئلة · مركز الاختبارات».

Composition/action: Keep the legacy window at its established right-side 54%-wide pose, with the caption outside it at left. At 0.0–0.45 s the new window content resolves through the existing browser frame; 0.28–1.3 s the three numbered cards arrive one by one; 1.4–2.7 s the study → practice → test labels illuminate sequentially; 2.7–4.6 s the entire path holds together for a clean read; 4.6–5.5 s the frame glides toward center and fades as the paper iris begins. The browser mock remains explicitly marked illustrative. The only interface claim is the path represented in the current Tahsili pages: subject study, question-bank practice, and test center. Handoff: the browser frame becomes the centered geometry of the unchanged paper/logo outro. Assets: existing frame and fonts, new CSS/React diagram; no fabricated captures. Sound: existing bed continues; no new VO/SFX.

### Marketing welcome film (`?film=marketing-welcome`) — revised, 36 s, 8 scenes
Revision brief (verbatim): «الفديو التسويقي جدا سئ». Rebuilt the promotional film only. The takeaway is a truthful, legible path through the implemented القدرات product: choose a foundation route, practise, try the mock-test interface, then review recorded training results. No promise of an official score or guaranteed improvement, and no claim that the platform aggregates outside study sources.

Focused clarity revision (verbatim): «تحفه الفديو الان ولاكن ايضا في ملباحظه بسيطه في النصوص تدخل في الصور المعروضه فهمتني». The approved story, runtime, soundtrack, and art direction stay locked. This pass separates explanatory copy from product imagery: side-column scenes retain a visible gutter between caption and browser frame; the exam interface is reduced and centered above a dedicated caption band; timed coral markers remain as small visual rings, but their former text labels no longer sit on top of screenshot content.

Treatment remains the editorial “path, then proof” brand film. Navy carries the question and the end-to-end thread; paper-colored product screens are the evidence, not background decoration. Tajawal carries decisive short headlines, IBM Plex Sans Arabic supports them; coral marks the active step, mint marks what is available. The hero changes from a typographic question, to a three-step route, to three distinct real product screens. One continuous browser frame glides and resizes between those screens; headline placement and screen scale change with each beat. Short circular mask reveals, screen cross-dissolves, and a paper iris into the final logo make the cuts compound without turning the film into a sequence of generic slides. Keep the existing 36.05-second instrumental and its 8.5 s / 17 s lifts.

| # / time | Duration | Shot / exact content | Composition and choreographed action | Handoff |
|---|---:|---|---|---|
| 01 · 0–4.5 s | 4.5 s | m_hook · «من وين تبدأ؟»; route labels «تأسيس» / «تدريب» / «مراجعة» | Navy field. The coral question is present from frame 0 at the upper third. At 0.8 / 1.04 / 1.28 s the three mint/coral labels snap in left-to-right as arranged on one rail; the coral underline draws from 1.15–1.8 s, then holds. The marks are a visual metaphor, not claims about an individual result. | The rail aligns with the next scene’s curved path; the incoming circular mask opens as the labels change from three points to three stages. |
| 02 · 4.5–8.5 s | 4 s | m_gather · «خطوات واضحة» / «للاستعداد لاختبار القدرات» / «تأسيس · تدريب · مراجعة» | No browser. Headline and subline enter at 0.16 s. A coral path draws from 0.48–1.78 s; the three stage dots appear at 0.82 / 1.20 / 1.58 s, with their labels staggered from 0.95 s. The line settles, then a thin mint rule draws at 2.8 s. | The last point becomes the collapsed browser-frame origin. As the iris opens, the persistent frame expands and glides to the foundation pose; foundation.jpg cross-dissolves inside it. |
| 03 · 8.5–12.5 s | 4 s | m_foundation · «ابدأ من الأساس» / «اختر الكمي أو اللفظي وابدأ» | Existing foundation.jpg, cropped only to remove its development banner. Browser occupies 57% of canvas width at left; the right-side copy stays outside the image, with a 6% open gutter. The screenshot starts at 1.025× and slowly pushes to 1.18×. Coral rings (no text labels) mark «الكمي» at 1.05 s and «اللفظي» at 1.8 s; neither option is shown as selected. Eyebrow / title / support resolve at 0.12 / 0.18 / 0.65 s. | The persistent browser frame holds its place while the image opens through a center-out inset mask to n-mock.jpg; URL bar updates to /mock-exams. |
| 04 · 12.5–17 s | 4.5 s | m_practice · «تدرّب على اختيارك» / «لفظي ٦٥ · كمي ٥٥ · شامل ١٢٠ سؤالًا» | Existing n-mock.jpg occupies 57% of canvas width at left; the copy column remains outside the screenshot across a 5% gutter. The whole screenshot opens through an inset mask. Timed coral rings mark the verbal / quantitative / comprehensive options at 0.65 / 1.45 / 2.25 s; there are no floating text tags over the cards. The separate right-side line lists the exact counts shown on the page. A restrained image push continues as all three choices settle together for the final read. | The persistent frame widens and rises; the mock-test screen cross-dissolves into the instructions screen. |
| 05 · 17–22 s | 5 s | m_exam · «جرّب واجهة الاختبار» / «مؤقت · سؤال واحد في كل شاشة · خريطة للأسئلة» | Three existing, illustrative screens with no submitted answers: n-exam-instr.jpg from 0–1.8 s → n-exam-answer.jpg from 1.8–3.5 s → n-exam-q2.jpg from 3.5–5.0 s. The browser is centered at 70% width and ends at 73% of canvas height. Coral rings—not floating labels—mark the timer, question/map, passage text, and save/next controls. The two copy lines stay on separate navy plates in a dedicated lower band, clear of the browser. No implication of an official test, proctoring result, or score. | The same frame glides down-left as its contents cross-dissolve to the real records page; URL changes to /records. |
| 06 · 22–25.5 s | 3.5 s | m_results · «راجع نتيجتك» / «نتائج تدريبية داخل المنصة، وليست درجة قياس الرسمية» | Existing n-records.jpg, which shows the genuine empty state rather than invented scores. It occupies 57% of canvas width at left; the actual report area stays separate from the right-side copy across a 5% gutter. Eyebrow / title / support resolve at +0.12 / +0.18 / +0.65 s. | The frame glides into the familiar left-side pose as its contents open to the Tahsili study-path illustration; URL changes to /student-program/tahsili. |
| 07 · 25.5–31 s | 5.5 s | m_plans · «مسار التحصيلي» / «ابدأ بالمادة» / «ادرس، طبّق، ثم اختبر جاهزيتك» | An illustrative screen, explicitly marked «عرض توضيحي لمسار الطالب», occupies 57% of canvas width at left; the right-side copy remains outside it across a 5% gutter. The visible cards state the real study sequence: choose الرياضيات / الفيزياء / الكيمياء / الأحياء; study in مركز الدراسة; practise in بنك الأسئلة; choose a subject, custom, or comprehensive test. The browser bar names the program route `/student-program/tahsili`; the cards identify the following learning destinations. Cards arrive at +0.28 / +1.0 / +1.72 s; lower route labels clarify at +0.72 / +1.2 / +1.68 s. Copy enters at +0.12 / +0.18 / +0.65 s. No performance or readiness outcome is promised. | Persistent frame glides to center and fades while a centered paper iris opens into the end card. |
| 08 · 31–36 s | 5 s | m_outro · «طريقك يبدأ بخطوة» / «ابدأ تجربتك المجانية · ٣ أيام» / qodratak.sa / «منصة تدريبية مستقلة غير تابعة لقياس · النتائج تدريبية ولا تضمن درجة» | Inverted ending: warm paper field, dark ink, official qodratak-logo-transparent.png. A centered paper iris reveals the field. Headline enters at +0.48 s, logo at +0.78 s, 3-day trial line at +1.22 s, site at +1.55 s, and disclaimer at +1.9 s; the complete lockup remains legible through the closing beat. | A small navy dot contracts to center; at loop handoff the opener’s question emerges from that point through its own circular reveal. |

All starts/durations sum to 36.0 seconds. Main copy is plain Arabic text, not baked into generated art. Existing assets remain unchanged; the new Tahsili screen is an explicitly-labelled illustrative layout built from the current route and feature labels, not a claimed capture. The closing scene continues to use the actual full logo `qodratak-logo-transparent.png` already in the artifact.

Audio: unchanged marketing_music.mp3 (36.05 s), oud/plucks opening, lift at ~8.5 s and larger lift at ~17 s (previously measured RMS -30→-24 dB, -23→-15 dB), fade at 34 s. Cuts at 8.5 s and 17 s align by timeline; this revision does not re-measure beat alignment. No voiceover or sound effects.
## URL contract
default = full guide · ?film=marketing (public homepage cut) · ?film=marketing-welcome · ?chapter=KEY (tahsili = study path; mock = mock+instructions+runner+passage) · ?muted=1.
- Embed legibility pass: critical text sized for 350x197/600x338 embeds (titles 10vmin, lines 5vmin, pins 4.2vmin, URL bar 3.2vmin, disclaimer 4.4vmin).

## Supplemental chapter clips (?chapter=KEY only) — src/components/video/ExtraChapters.tsx
These are not part of the 72 s base guide or the 36 s promo. Each clip runs 7.5 s and loops (played as _r1/_r2), uses the existing bg_music_full.mp3 at a fixed offset, and has a qodratak.sa/<route> frame on the left, a title, and three numbered points that appear at 0.9/1.8/2.7 s.
Keys → routes: tahsili /student-program/tahsili · flashcards /flashcards · analysis /performance-report · mistakes /mistake-challenge (EnhancedMistakeChallenge: questions come from a test result you got wrong (stored in localStorage), 6 modes, then percentage/correct/points; without a stored challenge the page sends you to /test-results) · security /security-settings · preexam /pre-exam-day · tutor /ai-tutor · rooms /study-rooms · notifications /notifications.
Labels are copied from the real page sources. Only notifications uses a real screenshot (n-notif.jpg). The other pages require sign-in, so they appear as panels marked «رسم توضيحي من الصفحة», with placeholder values (—) instead of made-up numbers.

The Tahsili clip is a new truthful, clearly illustrated path (not a captured student account): choose a subject → study its explanation in the study center → practise from the question bank and review → choose a subject, custom, or comprehensive test. Its panel shows four foundation subjects and the real study, question-bank, and test-center labels; it makes no score or completion claim.

## Revision: full platform guide + role guides + personal greeting
URL contract: default / ?film=guide = full student guide · ?film=admin · ?film=institution · ?film=teacher · ?film=marketing · ?film=marketing-welcome · ?chapter=tahsili and all prior chapter keys.

Personalization (viewer.tsx): parent posts {type:'qodratak.guide.viewer', displayName}; accepted only when event.source===window.parent && event.origin===location.origin. The iframe posts {type:'qodratak.guide.ready'} to the parent at location.origin once the listener is attached. The name is cleaned (control and bidi characters removed, whitespace collapsed, max 32 code points) and shown only as React text in «هلا، name». With no name the greeting is «هلا». Nothing is stored or fetched.

Full student guide, 119.9 s, 26 scenes: intro (هلا + دليلك الكامل للمنصة + كيف تستخدم قدراتك؟) · 14 original steps unchanged · rating chapter · 4.6 s Tahsili path · 8 existing extra pages at 4.6 s (their standalone ?chapter clips remain 7.5 s) · outro 5.5 s. The Tahsili chapter follows the rating chapter, before the existing extras; the guide remains 16:9 and the official full logo end card is unchanged. Audio: bg_music_full continues through the first 66.5 s; supplemental chapters use one continuous existing-bed passage from 4.5 to 56.9 s; the outro seeks back to its original 66.5 s.

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

## Revision: Tahsili program + student study path — 36 s homepage films and 119.9 s full guide

Both public marketing cuts now state the Tahsili program and replace «التحصيلي · قريبًا» with an explicit study path. They keep the existing 16:9 ratio, the opening and all unaffected scenes, the established browser/caption placements, music file, and the actual full Qodratak logo already in the outro. Homepage runtime remains exactly 36 s and eight scenes; the first 17 s remain unchanged so the existing 8.5 s and 17 s music lifts still align.

Marketing edit timings after the unchanged 17 s boundary: the exam scene is 5 s (three existing screens at 0–1.8 / 1.8–3.5 / 3.5–5.0 s); results is 3.5 s; the existing m_plans beat is 5.5 s; outro remains at 31–36 s. In m_plans, the persistent browser retains its side pose and shows a labelled illustrative Tahsili path. Exact screen text: «التحصيلي المتكامل» / «مسار الدراسة والتدريب والاختبار»; ١ «اختر المادة — رياضيات · فيزياء · كيمياء · أحياء»; ٢ «ادرس ثم طبّق — مركز الدراسة والشرح، ثم بنك الأسئلة»; ٣ «اختبر جاهزيتك — حسب المادة · مخصص · شامل». Footer: «شرح المادة · بنك الأسئلة · مركز الاختبارات» and «عرض توضيحي لمسار الطالب». Copy outside the browser: «مسار التحصيلي» / «ابدأ بالمادة» / «ادرس، طبّق، ثم اختبر جاهزيتك». Cards arrive sequentially, then all three hold as one readable route; the browser glides into the unchanged paper/logo outro. This illustrative screen is not represented as a real captured student account. No performance or score claim.

The full guide inserts x_tahsili after x_review and before the existing eight supplementary pages. It is 4.6 s (not a new interstitial or a ratio change). Exact copy: eyebrow «مسار التحصيلي · من الدراسة إلى الاختبار»; title «ابدأ بالمادة»; bullets at +0.9 / +1.8 / +2.7 s: «اختر الرياضيات أو الفيزياء أو الكيمياء أو الأحياء» / «ادرس الشرح في مركز الدراسة، ثم طبّق» / «تدرّب من بنك المادة، ثم اختر اختبارك»; note at +3.8 s: «اختبار حسب المادة · مخصص · شامل». The browser panel shows the same three study stages and is marked «رسم توضيحي من الصفحة» / «عرض توضيحي لمسار الطالب». Handoff: the outlined step number and browser stage remain in their established persistent layer; after the clip exits, the existing flashcards page opens at the same frame and the next chapter continues. No new footage, mock student data, score, or soundtrack is introduced.

Runtime control: to keep the whole guide below the 120 s ceiling, each of the eight existing embedded supplementary pages is 4.6 s instead of 5.1 s (all scenes remain; their existing standalone clips remain 7.5 s). Together with the unchanged 66.5 s core, 6.5 s x_review, nine 4.6 s supplementary pages, and 5.5 s outro, the full guide totals 119.9 s and 26 scenes. No changes to role films or their scenes.

Full-guide outro frame scan found a brief paper-only interval while the official logo waited for its entrance. To keep the same real full logo and mosaic→paper payoff without a blank field, the paper iris now opens at +2.1 s, the logo starts at +2.45 s, and the existing tagline starts at +3.15 s. The brand, copy, overall 5.5 s outro, and loop handoff remain unchanged.
Runtime: the 8 extra pages are 5.1 s each (were 5.5 s). Bed offsets: review 4.5 s, then extras continuous from 11 s at 5.1 s steps. x_review runs 66.5–73.0 s; flashcards starts at 73.0 s.

## Revision: make the account chapter visibly play as a walkthrough

User feedback (verbatim): «هذا اللي بقى بيظهر مش الفديوهات». The supplied image shows the account chapter inside the guide page, but its dominant visual is a near-static account-page capture. Keep the existing account-specific `?chapter=account` route, the surrounding iframe/player, the 16:9 ratio, all scene boundaries, and the existing audio. No MP4 screen recordings were supplied, so this revision makes the account scene read as an animated browser film rather than claiming to add recorded footage.

### Shot 13 / 58.5–62.5 s / 4.0 s — «حسابي»

Purpose: Show that account details, subscription, and security are distinct parts of the same page, and make the clip unmistakably move from one to the next.

Exact content: outside the browser, «حسابي», «هنا تدير حسابك», «بياناتك واشتراكك وإعدادات الأمان». Inside the existing account capture, three sequential labels: «بيانات الحساب», «الاشتراك», «الأمان». No account value is added or changed.

Composition and artistic idea: Retain the established full-frame layout and persistent browser stage. The authentic `account.jpg` capture is cropped above its development banner. A single visible cursor becomes the tour guide, travelling from the profile card to the subscription card, then back across to the security card; each stop is met by a coral target pulse and a navy label. The camera tightens and reframes in three measured steps, turning the original still capture into a directed page tour rather than leaving it as a static screen.

Timed choreography: 0.00–0.55 s: the browser glides into the centered full pose from «نتائجي» as the account capture cross-dissolves in; the image starts at 1.04×. 0.55–1.65 s: camera moves to 1.16×, cursor arrives at the profile card, and «بيانات الحساب» resolves. 1.65–2.75 s: camera advances toward 1.31× and reframes right/down onto the subscription card; cursor clicks, coral ring pulses, and «الاشتراك» appears. 2.75–3.75 s: cursor crosses left to the security card; the camera settles at 1.34×, a second click pulse appears, and «الأمان» resolves. 3.75–4.00 s: the browser starts its glide toward the next support-page pose while the cursor and third label remain in motion; no static tail.

Transition contract: incoming from results by the existing browser-stage glide and screenshot cross-dissolve. Outgoing to support through the same persistent browser moving from centered/full to left; the next screenshot replaces the account capture inside the same frame. The moving cursor is removed with this shot and is not a persistent layer.

Assets and technique: Existing genuine account screenshot `public/shots/account.jpg`; existing Tajawal / IBM Plex Sans Arabic and browser frame; deterministic Framer Motion camera keyframes, cursor path, and timed coral callouts. No new media assets or footage. Sound: existing `bg_music_full.mp3` and existing account offset; no VO/SFX or newly asserted beat sync.

Runtime lock: account remains 4.0 s; the guide's existing durations, chapter map, and iframe/player controls are unchanged. The page-specific chapter remains the account shot.

## Revision: student guide naming and Tahsili availability

The student guide now labels the preparation-plan page «خطتي» rather than «دورتي», including its scene title in the player controls. The on-screen explanation now describes following a preparation plan for القدرات or التحصيلي instead of booking an exam appointment. Both homepage marketing cuts and the standalone Tahsili chapter retain the implemented Tahsili study → question-bank → test-center path; the old «قريبًا» claim remains removed. This guide describes the visible route and does not claim that any unavailable question banks or backend content have been added.
