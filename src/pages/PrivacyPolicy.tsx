import React from 'react';
import { Shield, Lock, Cookie, AlertTriangle, FileText, Mail, ExternalLink } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
          </div>
          <p className="text-blue-100">
            نحن نولي أهمية كبيرة لخصوصيتك ونلتزم بحماية بياناتك الشخصية
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {/* Introduction */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">تمهيد</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            مرحبًا بك في موقع <strong>SA Forex</strong>. نحن نولي أهمية كبيرة لخصوصيتك ونلتزم بحماية بياناتك الشخصية وفقًا لأفضل الممارسات. من خلال استخدامك لهذا الموقع، فإنك توافق على سياسة الخصوصية التالية.
          </p>
        </section>

        {/* Data Collection */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">جمع المعلومات واستخدامها</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            نحن لا نجمع أي معلومات شخصية إلا عند تقديمها طواعية من قبلك، مثل التسجيل في النشرة الإخبارية أو التواصل معنا. قد نقوم بجمع بعض البيانات غير الشخصية تلقائيًا، مثل عنوان IP ونوع المتصفح، لتحسين تجربة المستخدم.
          </p>
        </section>

        {/* Cookies */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">ملفات تعريف الارتباط (Cookies)</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            قد يستخدم موقعنا ملفات تعريف الارتباط لتحسين أداء الموقع وتجربة المستخدم. يمكنك ضبط إعدادات المتصفح لتعطيل ملفات تعريف الارتباط إذا رغبت في ذلك.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl font-semibold">إخلاء المسؤولية</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            جميع التوصيات والمنشورات والتحليلات المقدمة على موقع <strong>SA Forex</strong> هي لأغراض تعليمية وإعلامية فقط، ولا تشكل بأي شكل من الأشكال نصيحة استثمارية أو دعوة لاتخاذ قرارات مالية. نحن لا نتحمل أي مسؤولية عن أي خسائر قد تنجم عن استخدام المحتوى المنشور على الموقع. يتحمل المستخدم وحده مسؤولية قراراته الاستثمارية.
          </p>
        </section>

        {/* Trading Risks */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold">مخاطر التداول</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            التداول في الأسواق المالية، بما في ذلك الفوركس والعملات الرقمية، ينطوي على مخاطر عالية وقد يؤدي إلى خسارة رأس المال بالكامل. يجب على المستخدمين التأكد من فهمهم الكامل للمخاطر قبل الانخراط في أي عمليات تداول، والحصول على استشارة مالية مستقلة إذا لزم الأمر.
          </p>
        </section>

        {/* Data Sharing */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">مشاركة البيانات مع أطراف ثالثة</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            نحن لا نبيع أو نشارك بياناتك الشخصية مع أي طرف ثالث إلا في الحالات التي يقتضيها القانون أو لحماية حقوقنا القانونية.
          </p>
        </section>

        {/* Policy Updates */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">تحديثات السياسة</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر، وسننشر أي تغييرات على هذه الصفحة. يُنصح بمراجعة هذه السياسة بانتظام.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">التواصل معنا</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            إذا كان لديك أي استفسارات حول سياسة الخصوصية، يمكنك التواصل معنا عبر التيلجرام:
          </p>
          <a 
            href="https://t.me/jordangold" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ExternalLink className="w-4 h-4" />
            https://t.me/jordangold
          </a>
        </section>

        {/* Acceptance */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold">قبولك لهذه السياسة</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            باستخدامك لموقع <strong>SA Forex</strong>، فإنك توافق على سياسة الخصوصية وإخلاء المسؤولية المذكورين أعلاه.
          </p>
        </section>
      </div>
    </div>
  );
}