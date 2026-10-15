export type TahsiliSourceSubject = 'رياضيات' | 'فيزياء' | 'كيمياء' | 'أحياء' | 'مختلط';
export type TahsiliSourceKind = 'primary_book' | 'foundation_book' | 'question_collection' | 'practice' | 'exam_collection';

export interface TahsiliSource {
  id: string;
  ordinal: number;
  title: string;
  originalName: string;
  subject: TahsiliSourceSubject;
  kind: TahsiliSourceKind;
  pages: number;
  bytes: number;
  primary: boolean;
  objectKey: string;
}

export const TAHSILI_PLAYLIST_REFERENCES = [
  { subject: 'فيزياء', url: 'https://www.youtube.com/playlist?list=PL3bx4rLe0cYymjKRZ8askQVbM5rNsYnYa' },
  { subject: 'رياضيات', url: 'https://www.youtube.com/playlist?list=PLJJaHzvc8NadlYDx3HIZKIKEsemAdrV7T' },
  { subject: 'كيمياء', url: 'https://www.youtube.com/playlist?list=PL5nvx2D7yzhNOGBdtfusB3-FojzOg5Wu-' },
  { subject: 'أحياء', url: 'https://www.youtube.com/playlist?list=PLZA3H-L5F1pk5IS20oNT0hD6nTtOkMiTJ' },
];

const source = (
  id: string,
  ordinal: number,
  title: string,
  originalName: string,
  subject: TahsiliSourceSubject,
  kind: TahsiliSourceKind,
  pages: number,
  bytes: number,
  primary = false,
): TahsiliSource => ({
  id,
  ordinal,
  title,
  originalName,
  subject,
  kind,
  pages,
  bytes,
  primary,
  objectKey: `tahsili/sources/${id}/source.pdf`,
});

export const TAHSILI_SOURCE_CATALOG: TahsiliSource[] = [
  source(
    'nasser-abdulkarim-main',
    1,
    'كتاب ناصر عبدالكريم للتحصيلي — المصدر الأساسي',
    '822748463-كتاب-ناصر-عبد-الكريم-للتحصيلي_1792016263581.pdf',
    'مختلط',
    'primary_book',
    297,
    107355647,
    true,
  ),
  source('ghasham-biology-2023', 2, 'تأسيس وتجميع أ. غشّام — أحياء 2023', 'تأسيس_وتجميع_أ.غشّام_أحياء_٢٠٢٣_1792016335719.pdf', 'أحياء', 'foundation_book', 152, 7283469),
  source('ghasham-physics-2023', 3, 'تأسيس وتجميع أ. غشّام — فيزياء 2023', 'تأسيس_وتجميع_أ.غشّام_فيزياء_٢٠٢٣_1792016335720.pdf', 'فيزياء', 'foundation_book', 117, 4290082),
  source('ghasham-chemistry-2023', 4, 'تأسيس وتجميع أ. غشّام — كيمياء 2023', 'تأسيس_وتجميع_أ.غشّام_كيمياء_٢٠٢٣_1792016335719.pdf', 'كيمياء', 'foundation_book', 85, 2868385),
  source('ghasham-math-2023', 5, 'تأسيس وتجميع أ. غشّام — رياضيات 2023', 'تأسيس_وتجميع_أ_غشّام_رياضيات_٢٠٢٣_1792016335719.pdf', 'رياضيات', 'foundation_book', 110, 5008231),
  source('al-kanz-biology-2024', 6, 'تجميع الكنز — أحياء وبيئة 2024', 'تجميع_الكنز_-_أحياء_وعلم_بيئة_24_1792016335718.pdf', 'أحياء', 'question_collection', 387, 243007244),
  source('al-kanz-math-2024', 7, 'تجميع الكنز — رياضيات 2024', 'تجميع_الكنز_-_رياضيات_24_1792016335718.pdf', 'رياضيات', 'question_collection', 328, 175259474),
  source('al-kanz-physics-2024', 8, 'تجميع الكنز — فيزياء 2024', 'تجميع_الكنز_-_فيزياء_24_1792016335718.pdf', 'فيزياء', 'question_collection', 353, 145583089),
  source('al-kanz-chemistry-2024', 9, 'تجميع الكنز — كيمياء 2024', 'تجميع_الكنز_-_كيمياء_24_1792016335716.pdf', 'كيمياء', 'question_collection', 297, 78292369),
  source('ghasham-practice-biology-period-1', 10, 'تدريبات أ. غشّام — أحياء، الفترة الأولى', 'تدريبات_أ_غشام_الفترة_الأولى_الأحياء_1792016237165.pdf', 'أحياء', 'practice', 20, 1918055),
  source('ghasham-practice-math-period-1', 11, 'تدريبات أ. غشّام — رياضيات، الفترة الأولى', 'تدريبات_أ_غشام_الفترة_الأولى_رياضيات_1792016234652.pdf', 'رياضيات', 'practice', 22, 3325478),
  source('ghasham-practice-physics-period-1', 12, 'تدريبات أ. غشّام — فيزياء، الفترة الأولى', 'تدريبات_أ_غشام_الفترة_الأولى_فيزياء_1792016240518.pdf', 'فيزياء', 'practice', 17, 1911413),
  source('ghasham-practice-chemistry-period-1', 13, 'تدريبات أ. غشّام — كيمياء، الفترة الأولى', 'تدريبات_أ_غشام_الفترة_الأولى_كيمياء_1792016227657.pdf', 'كيمياء', 'practice', 17, 1025240),
  source('friday-evening-p2-biology-2024', 14, 'اختبار الجمعة المسائي — أحياء، الفترة الثانية 2024', 'ف2_جمعة_مسائي_24_-_أحياء_1792016220148.pdf', 'أحياء', 'exam_collection', 14, 582540),
  source('friday-evening-p2-math-2024', 15, 'اختبار الجمعة المسائي — رياضيات، الفترة الثانية 2024', 'ف2_جمعة_مسائي_24_-_رياضيات_1792016207388.pdf', 'رياضيات', 'exam_collection', 13, 683309),
  source('friday-evening-p2-physics-2024', 16, 'اختبار الجمعة المسائي — فيزياء، الفترة الثانية 2024', 'ف2_جمعة_مسائي_24_-_فيزياء_1792016222600.pdf', 'فيزياء', 'exam_collection', 9, 474072),
  source('friday-evening-p2-chemistry-2024', 17, 'اختبار الجمعة المسائي — كيمياء، الفترة الثانية 2024', 'ف2_جمعة_مسائي_24_-_كيمياء_1792016214685.pdf', 'كيمياء', 'exam_collection', 16, 632904),
  source('yelo-2024-p2-thursday-evening', 18, 'يلو — فترات 2024، الفترة الثانية، الخميس المسائي', 'يلو_فترات_2024_-_ف2_الخميس_مسائي_1792016199422.pdf', 'مختلط', 'exam_collection', 88, 5749361),
];
