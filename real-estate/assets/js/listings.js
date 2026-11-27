/*
 * بيانات العقارات والوسطاء.
 * ملاحظة: كل العقارات والأسماء هنا أمثلة توضيحية فقط — استبدلها بالعقارات الحقيقية.
 *
 * حقول العقار:
 *  deal: "sale" (للبيع) أو "rent" (للإيجار)
 *  type: مفتاح من PROPERTY_TYPES
 *  gov: معرّف المحافظة من locations.js، place: المدينة/البلدة (أو الحي في دمشق)، district: حي اختياري
 *  price + currency ("USD" أو "SYP")، rentPeriod: "month" أو "year" (للإيجار فقط)
 *  size: المساحة م²، land: مساحة الأرض م² (اختياري)
 */

window.PROPERTY_TYPES = {
  apartment: "شقة",
  house: "منزل",
  "arabic-house": "بيت عربي",
  villa: "فيلا",
  chalet: "شاليه",
  land: "أرض",
  farm: "مزرعة",
  shop: "محل تجاري",
  office: "مكتب"
};

window.FINISH_LEVELS = ["سوبر ديلوكس", "ديلوكس", "جيد", "عادي", "على العظم"];

window.OWNERSHIP_TYPES = ["طابو أخضر", "حكم محكمة", "وكالة كاتب بالعدل", "سجل مؤقت"];

window.DIRECTIONS = ["قبلي", "شمالي", "شرقي", "غربي", "قبلي شرقي", "قبلي غربي", "شمالي شرقي", "شمالي غربي"];

// مزايا شائعة تظهر كخيارات جاهزة في لوحة التحكم (يمكن إضافة غيرها يدوياً)
window.COMMON_FEATURES = [
  "مصعد", "موقف سيارة", "طاقة شمسية", "شوفاج", "تكييف", "اشتراك أمبيرات", "مولدة خاصة",
  "مطبخ راكب", "بلكون", "تراس", "حديقة", "مسبح", "خزان ماء", "بئر ماء", "باب أمان",
  "إنترنت", "مفروش بالكامل", "إطلالة بحرية", "إطلالة جبلية", "حارس للبناء", "قبو", "سطح"
];

window.AGENTS = [
  { id: "a1", name: "سامر الخطيب", role: "مدير المكتب — مبيعات", govs: ["damascus"], languages: "العربية، الإنكليزية" },
  { id: "a2", name: "ريم العلي", role: "وسيطة عقارية — إيجارات", govs: ["damascus", "rif-dimashq"], languages: "العربية، الفرنسية" },
  { id: "a3", name: "ماهر الحسن", role: "وسيط عقاري", govs: ["rif-dimashq", "quneitra"], languages: "العربية" },
  { id: "a4", name: "لينا حداد", role: "وسيطة عقارية — الساحل", govs: ["latakia", "tartus"], languages: "العربية، الإنكليزية" },
  { id: "a5", name: "عمر الشامي", role: "مدير فرع حلب", govs: ["aleppo", "idlib"], languages: "العربية، التركية" },
  { id: "a6", name: "نور الدين سليمان", role: "وسيط عقاري", govs: ["homs", "hama"], languages: "العربية" },
  { id: "a7", name: "هبة منصور", role: "وسيطة عقارية", govs: ["as-suwayda", "daraa"], languages: "العربية، الإنكليزية" },
  { id: "a8", name: "خالد العبدالله", role: "وسيط عقاري — المنطقة الشرقية", govs: ["hasakah", "raqqa", "deir-ez-zor"], languages: "العربية، الكردية" }
];

window.LISTINGS = [
  {
    id: 101, deal: "sale", type: "apartment", featured: true,
    title: "شقة سوبر ديلوكس بإطلالة مفتوحة",
    gov: "damascus", place: "المزة",
    price: 210000, currency: "USD", negotiable: true,
    size: 165, rooms: 3, baths: 2, floor: 4, totalFloors: 7, year: 2012,
    finish: "سوبر ديلوكس", direction: "قبلي شرقي", ownership: "طابو أخضر", furnished: false,
    features: ["مصعد", "موقف سيارة", "طاقة شمسية", "شوفاج", "مطبخ راكب", "بلكون", "باب أمان", "اشتراك أمبيرات"],
    images: ["building-1", "living-6", "kitchen-1", "bedroom-1"],
    description: "شقة واسعة في موقع هادئ قريب من أوتوستراد المزة، مؤلفة من صالون كبير وثلاث غرف نوم وحمامين ومطبخ راكب. الإكساء سوبر ديلوكس حديث، والشقة مشمسة طوال النهار بفضل الاتجاه القبلي الشرقي. البناء مخدّم بمصعد ومولدة وطاقة شمسية للأقسام المشتركة.",
    agent: "a1", date: "2026-11-24"
  },
  {
    id: 102, deal: "sale", type: "apartment", featured: true,
    title: "شقة فاخرة في قلب المالكي",
    gov: "damascus", place: "المالكي",
    price: 520000, currency: "USD", negotiable: false,
    size: 240, rooms: 4, baths: 3, floor: 2, totalFloors: 5, year: 2008,
    finish: "سوبر ديلوكس", direction: "قبلي غربي", ownership: "طابو أخضر", furnished: false,
    features: ["مصعد", "موقف سيارة", "شوفاج", "تكييف", "مطبخ راكب", "تراس", "حارس للبناء", "باب أمان"],
    images: ["living-9", "living-7", "bedroom-1", "building-2"],
    description: "شقة نادرة في أحد أرقى أحياء دمشق، على بعد خطوات من الحدائق والمطاعم والسفارات. تضم صالوناً مزدوجاً وغرفة طعام وأربع غرف نوم منها غرفة ماستر بحمام خاص، إضافة إلى تراس واسع يطل على شارع مشجّر.",
    agent: "a1", date: "2026-11-21"
  },
  {
    id: 103, deal: "sale", type: "arabic-house", featured: true,
    title: "بيت عربي دمشقي بأرض ديار وبحرة",
    gov: "damascus", place: "ساروجة",
    price: 340000, currency: "USD", negotiable: true,
    size: 280, land: 190, rooms: 5, baths: 2, floor: 0, totalFloors: 2, year: 1890,
    finish: "جيد", direction: "قبلي", ownership: "طابو أخضر", furnished: false,
    features: ["أرض ديار", "بحرة", "ليوان", "قبو", "سطح", "أسقف خشبية مزخرفة"],
    images: ["living-8", "living-3", "living-5"],
    description: "بيت عربي أصيل في حي ساروجة التاريخي، يتوسطه صحن دار مبلّط بالحجر مع بحرة وأشجار ليمون ونارنج. يتألف من طابقين وليوان وخمس غرف بأسقف خشبية مزخرفة. مناسب للسكن العائلي أو للتحويل إلى دار ضيافة أو مطعم تراثي وفق الأنظمة.",
    agent: "a1", date: "2026-11-18"
  },
  {
    id: 104, deal: "rent", type: "apartment", featured: true,
    title: "شقة مفروشة بالكامل للإيجار",
    gov: "damascus", place: "أبو رمانة",
    price: 1200, currency: "USD", rentPeriod: "month",
    size: 180, rooms: 3, baths: 2, floor: 3, totalFloors: 6, year: 2010,
    finish: "سوبر ديلوكس", direction: "قبلي شرقي", ownership: "طابو أخضر", furnished: true,
    features: ["مفروش بالكامل", "مصعد", "شوفاج", "تكييف", "اشتراك أمبيرات", "إنترنت", "موقف سيارة"],
    images: ["living-4", "living-1", "bedroom-1", "kitchen-1"],
    description: "شقة أنيقة مفروشة بالكامل وجاهزة للسكن فوراً، مناسبة للعائلات أو للشركات والموظفين الأجانب. تحتوي على صالون وثلاث غرف نوم وحمامين، مع تكييف في كل الغرف واشتراك أمبيرات وإنترنت.",
    agent: "a2", date: "2026-11-25"
  },
  {
    id: 105, deal: "rent", type: "apartment",
    title: "شقة عائلية غير مفروشة قرب الجامع",
    gov: "damascus", place: "الميدان",
    price: 450, currency: "USD", rentPeriod: "month",
    size: 110, rooms: 2, baths: 1, floor: 1, totalFloors: 4, year: 1998,
    finish: "جيد", direction: "شرقي", ownership: "طابو أخضر", furnished: false,
    features: ["بلكون", "خزان ماء", "اشتراك أمبيرات", "قريب من المواصلات"],
    images: ["studio-1", "living-3"],
    description: "شقة مريحة في حي الميدان الشعبي القريب من الأسواق والمدارس والمواصلات. صالون وغرفتا نوم ومطبخ وحمام، مع بلكون مطل على الشارع. الإيجار شهري مع دفعة مقدمة لثلاثة أشهر.",
    agent: "a2", date: "2026-11-20"
  },
  {
    id: 106, deal: "rent", type: "villa", featured: true,
    title: "فيلا مستقلة مع حديقة ومسبح",
    gov: "damascus", place: "المزة", district: "فيلات غربية",
    price: 3000, currency: "USD", rentPeriod: "month",
    size: 420, land: 900, rooms: 5, baths: 4, floor: 0, totalFloors: 3, year: 2015,
    finish: "سوبر ديلوكس", direction: "قبلي", ownership: "طابو أخضر", furnished: true,
    features: ["مسبح", "حديقة", "موقف سيارة", "شوفاج", "تكييف", "طاقة شمسية", "مولدة خاصة", "غرفة حارس"],
    images: ["villa-3", "living-9", "living-7", "bedroom-1"],
    description: "فيلا مستقلة من ثلاثة طوابق في منطقة الفيلات الغربية الهادئة، مع حديقة خاصة ومسبح ومولدة كهرباء مستقلة. مناسبة لعائلة كبيرة أو مقر لبعثة دبلوماسية أو شركة.",
    agent: "a2", date: "2026-11-26"
  },
  {
    id: 107, deal: "sale", type: "villa", featured: true,
    title: "فيلا جبلية بإطلالة على سهل الزبداني",
    gov: "rif-dimashq", place: "الزبداني",
    price: 380000, currency: "USD", negotiable: true,
    size: 350, land: 1200, rooms: 4, baths: 3, floor: 0, totalFloors: 2, year: 2011,
    finish: "سوبر ديلوكس", direction: "قبلي غربي", ownership: "طابو أخضر", furnished: false,
    features: ["مسبح", "حديقة", "أشجار مثمرة", "إطلالة جبلية", "شوفاج", "بئر ماء", "موقف سيارة"],
    images: ["villa-2", "living-7", "living-2"],
    description: "فيلا مصيفية فاخرة على أرض مساحتها 1200 م² مزروعة بالأشجار المثمرة، مع مسبح وجلسات خارجية وإطلالة مفتوحة على سهل الزبداني. تبعد نحو 45 دقيقة عن دمشق.",
    agent: "a3", date: "2026-11-19"
  },
  {
    id: 108, deal: "sale", type: "apartment",
    title: "شقة حديثة في ضاحية هادئة",
    gov: "rif-dimashq", place: "صحنايا",
    price: 68000, currency: "USD", negotiable: true,
    size: 130, rooms: 3, baths: 2, floor: 2, totalFloors: 5, year: 2019,
    finish: "ديلوكس", direction: "شمالي شرقي", ownership: "حكم محكمة", furnished: false,
    features: ["مصعد", "طاقة شمسية", "مطبخ راكب", "بلكون", "خزان ماء"],
    images: ["building-2", "living-5", "kitchen-1"],
    description: "شقة بإكساء ديلوكس في بناء حديث بصحنايا، قريبة من المدارس والأسواق وطريق درعا القديم. صالون وثلاث غرف نوم وحمامان، مع طاقة شمسية لتسخين المياه.",
    agent: "a3", date: "2026-11-15"
  },
  {
    id: 109, deal: "sale", type: "apartment",
    title: "شقة اقتصادية مناسبة للأزواج الجدد",
    gov: "rif-dimashq", place: "قدسيا",
    price: 45000, currency: "USD", negotiable: true,
    size: 95, rooms: 2, baths: 1, floor: 3, totalFloors: 4, year: 2005,
    finish: "جيد", direction: "قبلي", ownership: "وكالة كاتب بالعدل", furnished: false,
    features: ["بلكون", "إطلالة جبلية", "اشتراك أمبيرات"],
    images: ["building-1", "living-3"],
    description: "شقة صغيرة مشمسة في قدسيا بسعر مناسب، صالون وغرفتا نوم وإطلالة جميلة على الجبل. خيار جيد للسكن الأول أو للاستثمار بالإيجار.",
    agent: "a3", date: "2026-11-12"
  },
  {
    id: 110, deal: "rent", type: "apartment",
    title: "شقة مفروشة قرب ساحة السيوف",
    gov: "rif-dimashq", place: "جرمانا",
    price: 300, currency: "USD", rentPeriod: "month",
    size: 100, rooms: 2, baths: 1, floor: 2, totalFloors: 5, year: 2014,
    finish: "ديلوكس", direction: "شرقي", ownership: "طابو أخضر", furnished: true,
    features: ["مفروش بالكامل", "اشتراك أمبيرات", "إنترنت", "خزان ماء"],
    images: ["studio-1", "living-1"],
    description: "شقة مفروشة نظيفة في منطقة حيوية من جرمانا، قريبة من المواصلات إلى دمشق. صالون وغرفتا نوم ومطبخ مجهز.",
    agent: "a2", date: "2026-11-22"
  },
  {
    id: 111, deal: "sale", type: "land",
    title: "أرض زراعية مشجرة بالزيتون",
    gov: "rif-dimashq", place: "دير عطية",
    price: 60000, currency: "USD", negotiable: true,
    size: 5000, land: 5000, rooms: 0, baths: 0,
    finish: "", direction: "", ownership: "طابو أخضر", furnished: false,
    features: ["أشجار زيتون", "بئر ماء", "طريق معبّد", "كهرباء قريبة"],
    images: ["land-1"],
    description: "قطعة أرض زراعية مساحتها 5 دونمات مزروعة بأشجار الزيتون، مع بئر ماء وطريق معبّد حتى الأرض. مناسبة للاستثمار الزراعي أو لبناء بيت ريفي وفق الأنظمة.",
    agent: "a3", date: "2026-11-08"
  },
  {
    id: 112, deal: "sale", type: "villa",
    title: "فيلا عصرية مع مسبح في منطقة الديماس",
    gov: "rif-dimashq", place: "الديماس",
    price: 450000, currency: "USD", negotiable: true,
    size: 400, land: 1500, rooms: 5, baths: 4, floor: 0, totalFloors: 2, year: 2021,
    finish: "سوبر ديلوكس", direction: "قبلي", ownership: "طابو أخضر", furnished: false,
    features: ["مسبح", "حديقة", "طاقة شمسية", "مولدة خاصة", "شوفاج", "تكييف", "موقف سيارة"],
    images: ["villa-5", "living-9", "kitchen-1", "bedroom-1"],
    description: "فيلا حديثة بتصميم معماري عصري على أرض 1500 م²، مع مسبح وحديقة ونظام طاقة شمسية متكامل. قريبة من طريق بيروت وتبعد نحو 25 دقيقة عن مركز دمشق.",
    agent: "a3", date: "2026-11-23"
  },
  {
    id: 113, deal: "sale", type: "apartment",
    title: "شقة واسعة في حي الفرقان",
    gov: "aleppo", place: "مركز جبل سمعان (حلب)", district: "الفرقان",
    price: 85000, currency: "USD", negotiable: true,
    size: 150, rooms: 3, baths: 2, floor: 3, totalFloors: 6, year: 2007,
    finish: "ديلوكس", direction: "قبلي شرقي", ownership: "طابو أخضر", furnished: false,
    features: ["مصعد", "بلكون", "شوفاج", "اشتراك أمبيرات", "خزان ماء"],
    images: ["living-6", "building-1", "living-4"],
    description: "شقة في حي الفرقان الراقي بحلب، قريبة من الجامعة والأسواق. صالون كبير وثلاث غرف نوم وحمامان، بإكساء ديلوكس وتهوية ممتازة.",
    agent: "a5", date: "2026-11-17"
  },
  {
    id: 114, deal: "sale", type: "shop",
    title: "محل تجاري على شارع رئيسي",
    gov: "aleppo", place: "مركز جبل سمعان (حلب)", district: "العزيزية",
    price: 120000, currency: "USD", negotiable: true,
    size: 60, rooms: 0, baths: 1, floor: 0, totalFloors: 5, year: 2000,
    finish: "جيد", direction: "", ownership: "طابو أخضر", furnished: false,
    features: ["واجهة زجاجية", "سدة", "شارع تجاري", "حمام"],
    images: ["office-1"],
    description: "محل تجاري بواجهة زجاجية عريضة وسدة داخلية على شارع تجاري نشط في العزيزية. مناسب لمعرض ألبسة أو مكتب أو مطعم صغير.",
    agent: "a5", date: "2026-11-10"
  },
  {
    id: 115, deal: "sale", type: "apartment", featured: true,
    title: "شقة بإطلالة بحرية مباشرة",
    gov: "latakia", place: "اللاذقية", district: "الكورنيش الجنوبي",
    price: 140000, currency: "USD", negotiable: true,
    size: 160, rooms: 3, baths: 2, floor: 6, totalFloors: 9, year: 2016,
    finish: "سوبر ديلوكس", direction: "غربي", ownership: "طابو أخضر", furnished: false,
    features: ["إطلالة بحرية", "مصعد", "تكييف", "طاقة شمسية", "بلكون", "موقف سيارة"],
    images: ["living-7", "living-9", "bedroom-1"],
    description: "شقة في برج سكني حديث على الكورنيش الجنوبي في اللاذقية، بإطلالة بحرية مباشرة من الصالون وغرفة النوم الرئيسية. البناء مخدّم بمصعدين وموقف سيارات.",
    agent: "a4", date: "2026-11-24"
  },
  {
    id: 116, deal: "rent", type: "house",
    title: "بيت جبلي للإيجار الصيفي",
    gov: "latakia", place: "صلنفة",
    price: 700, currency: "USD", rentPeriod: "month",
    size: 140, land: 400, rooms: 3, baths: 2, floor: 0, totalFloors: 2, year: 2013,
    finish: "ديلوكس", direction: "قبلي", ownership: "طابو أخضر", furnished: true,
    features: ["مفروش بالكامل", "حديقة", "إطلالة جبلية", "مدفأة حطب", "موقف سيارة"],
    images: ["house-2", "living-2"],
    description: "بيت حجري دافئ بين أشجار الصنوبر في صلنفة، مع حديقة وجلسة خارجية ومدفأة حطب. متاح للإيجار الشهري خلال موسم الصيف.",
    agent: "a4", date: "2026-11-14"
  },
  {
    id: 117, deal: "sale", type: "villa", featured: true,
    title: "فيلا بين الجبال والبحر",
    gov: "tartus", place: "مشتى الحلو",
    price: 260000, currency: "USD", negotiable: true,
    size: 300, land: 1000, rooms: 4, baths: 3, floor: 0, totalFloors: 2, year: 2017,
    finish: "سوبر ديلوكس", direction: "غربي", ownership: "طابو أخضر", furnished: false,
    features: ["مسبح", "حديقة", "إطلالة جبلية", "شوفاج", "طاقة شمسية", "موقف سيارة"],
    images: ["villa-4", "living-8", "living-4"],
    description: "فيلا راقية في مشتى الحلو، أحد أجمل المصايف السورية، مع مسبح وحديقة ومناظر خضراء ممتدة حتى البحر في الأيام الصافية.",
    agent: "a4", date: "2026-11-20"
  },
  {
    id: 118, deal: "sale", type: "chalet",
    title: "شاليه على البحر مباشرة",
    gov: "tartus", place: "طرطوس", district: "الكورنيش البحري",
    price: 95000, currency: "USD", negotiable: true,
    size: 90, rooms: 2, baths: 1, floor: 0, totalFloors: 1, year: 2018,
    finish: "ديلوكس", direction: "غربي", ownership: "طابو أخضر", furnished: true,
    features: ["إطلالة بحرية", "مفروش بالكامل", "تراس", "تكييف"],
    images: ["villa-1", "studio-1"],
    description: "شاليه مفروش داخل منتجع بحري على الكورنيش، مع تراس يطل على البحر مباشرة. مناسب للاستخدام الشخصي أو للتأجير الصيفي.",
    agent: "a4", date: "2026-11-11"
  },
  {
    id: 119, deal: "rent", type: "office",
    title: "مكتب إداري في منطقة الإنشاءات",
    gov: "homs", place: "حمص", district: "الإنشاءات",
    price: 500, currency: "USD", rentPeriod: "month",
    size: 120, rooms: 4, baths: 1, floor: 2, totalFloors: 6, year: 2009,
    finish: "ديلوكس", direction: "شرقي", ownership: "طابو أخضر", furnished: false,
    features: ["مصعد", "تكييف", "إنترنت", "موقف سيارة"],
    images: ["office-1"],
    description: "مكتب مجهز من أربع غرف وصالة استقبال في منطقة الإنشاءات، مناسب لشركة أو عيادة أو مكتب محاماة.",
    agent: "a6", date: "2026-11-16"
  },
  {
    id: 120, deal: "sale", type: "house",
    title: "منزل مستقل مع حديقة",
    gov: "hama", place: "مصياف",
    price: 75000, currency: "USD", negotiable: true,
    size: 220, land: 500, rooms: 4, baths: 2, floor: 0, totalFloors: 2, year: 2006,
    finish: "جيد", direction: "قبلي", ownership: "طابو أخضر", furnished: false,
    features: ["حديقة", "أشجار مثمرة", "بئر ماء", "طاقة شمسية", "موقف سيارة"],
    images: ["house-3", "living-1"],
    description: "منزل مستقل من طابقين في مصياف، مع حديقة مزروعة وأشجار مثمرة وبئر ماء. موقع هادئ قريب من مركز البلدة.",
    agent: "a6", date: "2026-11-09"
  },
  {
    id: 121, deal: "sale", type: "apartment",
    title: "شقة في مركز مدينة السويداء",
    gov: "as-suwayda", place: "السويداء",
    price: 48000, currency: "USD", negotiable: true,
    size: 140, rooms: 3, baths: 1, floor: 1, totalFloors: 3, year: 2003,
    finish: "جيد", direction: "قبلي شرقي", ownership: "طابو أخضر", furnished: false,
    features: ["بلكون", "خزان ماء", "طاقة شمسية"],
    images: ["building-2", "living-5"],
    description: "شقة مريحة في مركز مدينة السويداء، قريبة من الخدمات والأسواق. صالون وثلاث غرف نوم ومطبخ وحمام.",
    agent: "a7", date: "2026-11-13"
  },
  {
    id: 122, deal: "sale", type: "farm",
    title: "مزرعة مع بيت ريفي",
    gov: "daraa", place: "بصرى الشام",
    price: 110000, currency: "USD", negotiable: true,
    size: 160, land: 8000, rooms: 3, baths: 1, floor: 0, totalFloors: 1, year: 2010,
    finish: "عادي", direction: "قبلي", ownership: "طابو أخضر", furnished: false,
    features: ["بيت ريفي", "بئر ماء", "أشجار زيتون", "سور كامل", "طريق معبّد"],
    images: ["land-1", "house-1"],
    description: "مزرعة مسوّرة مساحتها 8 دونمات قرب بصرى الشام، فيها بيت ريفي من ثلاث غرف وبئر ماء وأشجار زيتون مثمرة.",
    agent: "a7", date: "2026-11-07"
  },
  {
    id: 123, deal: "rent", type: "apartment",
    title: "شقة للإيجار السنوي",
    gov: "hasakah", place: "القامشلي",
    price: 3000, currency: "USD", rentPeriod: "year",
    size: 125, rooms: 3, baths: 1, floor: 2, totalFloors: 4, year: 2011,
    finish: "ديلوكس", direction: "شرقي", ownership: "طابو أخضر", furnished: false,
    features: ["بلكون", "اشتراك أمبيرات", "خزان ماء", "مطبخ راكب"],
    images: ["building-1", "living-4"],
    description: "شقة نظيفة في حي سكني هادئ بالقامشلي، صالون وثلاث غرف نوم ومطبخ راكب. الإيجار سنوي.",
    agent: "a8", date: "2026-11-18"
  }
];
