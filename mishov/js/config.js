/* =====================================================================
   תצורה + טקסונומיה משותפת.
   ה-anon key הוא ציבורי בכוונת התכנון — מה שמגן על הנתונים הוא RLS
   בסכימה, לא סודיות המפתח. אל תשים כאן service_role.
   ===================================================================== */
window.CFG = (function () {

  var SUPABASE_URL      = '';   // https://xxxxxxxx.supabase.co
  var SUPABASE_ANON_KEY = '';   // eyJhbGci...

  var qs = new URLSearchParams(location.search);

  return {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,

    // בלי מפתחות — נופלים אוטומטית לנתוני דמה, כך שאפשר לעצב בלי תשתית
    MOCK: qs.get('mock') === '1' || !SUPABASE_URL || !SUPABASE_ANON_KEY,

    // גדר חיכוך מול ספאם מהאינטרנט הפתוח. להדליק רק אם צריך,
    // ולהפיץ את הקוד בקבוצת הוואטסאפ של המחזור.
    REQUIRE_ACCESS_CODE: false,
    ACCESS_CODE: '',

    GOAL: 80,              // יעד המשובים שמוצג בפס ההתקדמות
    MIN_SECONDS: 25,       // מתחת לזה זה בוט, לא אדם
    MIN_N: 5,              // סף חשיפת סטטיסטיקה (חייב להתאים ל-schema.sql)

    COHORTS: [
      { key: 'year3',  label: "שנה ג'" },
      { key: 'year4',  label: "שנה ד'" },
      { key: 'alumni', label: 'בוגר/ת' }
    ],

    TRACKS: [
      { key: 'info',       label: 'מערכות מידע' },
      { key: 'production', label: 'מערכות ייצור' },
      { key: 'other',      label: 'אחר' }
    ],

    // שבעת הנושאים — נגזרים ישירות מהמשובים שנאספו במחלקה
    THEMES: [
      { key: 'courses',     col: 't_courses_outdated', label: 'קורסים מיושנים', short: 'קורסים מיושנים',
        q: 'עד כמה תוכני הקורסים היו מעודכנים לתעשייה של היום?',
        lo: 'מעודכנים לגמרי', hi: 'מיושנים לגמרי' },
      { key: 'project',     col: 't_final_project', label: 'פרויקט גמר', short: 'פרויקט גמר',
        q: 'עד כמה פרויקט הגמר וההנחיה שלו היו מותאמים ומועילים?',
        lo: 'מותאם ומועיל', hi: 'לא מותאם בכלל' },
      { key: 'attitude',    col: 't_dept_attitude', label: 'יחס המחלקה', short: 'יחס המחלקה',
        q: 'עד כמה המחלקה התייחסה ברצינות לבעיות שעלו במהלך הסמסטר?',
        lo: 'התייחסות רצינית', hi: 'התעלמות מוחלטת' },
      { key: 'industry',    col: 't_industry_link', label: 'קשר לתעשייה', short: 'קשר לתעשייה',
        q: 'עד כמה התואר חיבר אתכם לתעשייה בחוץ — הרצאות, סיורים, קשרים?',
        lo: 'חיבור חזק', hi: 'אין חיבור בכלל' },
      { key: 'teaching',    col: 't_teaching_quality', label: 'איכות ההוראה', short: 'איכות ההוראה',
        q: 'עד כמה רמת ההוראה תאמה את הרמה האקדמית שנדרשה מכם?',
        lo: 'תאמה במלואה', hi: 'פער חמור' },
      { key: 'regulations', col: 't_regulations', label: 'שינויי נהלים', short: 'שינויי נהלים',
        q: 'עד כמה שינויי נהלים באמצע התואר פגעו בתכנון שלכם?',
        lo: 'לא פגעו', hi: 'פגעו קשות' },
      { key: 'miluim',      col: 't_miluim_gpa', label: 'ממוצע משותף למילואים', short: 'ממוצע מילואים',
        q: 'עד כמה ממוצע משותף למשרתי מילואים ולסטודנטים רגילים יצר עיוות?',
        lo: 'אין עיוות', hi: 'עיוות חמור' }
    ],

    // שמונה המיומנויות של מדד המוכנות
    SKILLS: [
      { key: 'sql',           col: 'r_sql',           label: 'SQL ובסיסי נתונים' , short: 'SQL' },
      { key: 'python',        col: 'r_python',        label: 'Python וניתוח נתונים' , short: 'Python' },
      { key: 'simulation',    col: 'r_simulation',    label: 'סימולציה' , short: 'סימולציה' },
      { key: 'deterministic', col: 'r_deterministic', label: 'מודלים דטרמיניסטיים' , short: 'אופטימיזציה' },
      { key: 'excel',         col: 'r_excel',         label: 'Excel ו-VBA' , short: 'Excel' },
      { key: 'projects',      col: 'r_projects',      label: 'ניהול פרויקטים' , short: 'ניהול פרויקטים' },
      { key: 'stats',         col: 'r_stats',         label: 'סטטיסטיקה יישומית' , short: 'סטטיסטיקה' },
      { key: 'interviews',    col: 'r_interviews',    label: 'ראיונות עבודה' , short: 'ראיונות' }
    ],

    STORE: {
      device:    'mishov_device_id',
      submitted: 'mishov_submitted',
      endorsed:  'mishov_endorsed',
      answers:   'mishov_last_answers'
    }
  };
})();
