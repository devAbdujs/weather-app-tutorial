const fs = require('fs');
const file = 'src/components/marketing/LandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header padding
content = content.replace(
  /className="relative px-6 pt-32 pb-16 flex flex-col items-center text-center max-w-3xl mx-auto w-full mt-8"/,
  'className="relative px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 flex flex-col items-center text-center max-w-3xl mx-auto w-full mt-4 sm:mt-8"'
);

// H1 leading
content = content.replace(
  /className="text-4xl sm:text-6xl font-black tracking-tight leading-\[1\.1\] mb-6 animate-fade-up"/,
  'className="text-[40px] sm:text-6xl font-black tracking-tight leading-tight sm:leading-[1.1] mb-6 animate-fade-up"'
);

// Mockup aspect ratio and sizing
content = content.replace(
  /className="w-full max-w-\[360px\] sm:max-w-\[800px\] sm:aspect-video aspect-\[9\/19\] rounded-\[32px\] sm:rounded-\[40px\] border-\[6px\] border-gray-900 shadow-2xl overflow-hidden bg-card relative"/,
  'className="w-full max-w-[340px] sm:max-w-[800px] h-[500px] sm:h-auto sm:aspect-video rounded-[32px] sm:rounded-[40px] border-[6px] border-gray-900 shadow-2xl overflow-hidden bg-card relative"'
);

// Mockup chat placement
content = content.replace(
  /className="absolute bottom-6 right-6 left-6 sm:left-auto sm:w-\[320px\] bg-white\/10/,
  'className="absolute bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[320px] bg-white/10'
);

// Features section padding
content = content.replace(
  /className="px-6 py-24 bg-card border-t border-black\/5 dark:border-white\/10"/,
  'className="px-6 py-16 sm:py-24 bg-card border-t border-black/5 dark:border-white/10"'
);

// Features cards padding
content = content.replaceAll(
  /className="flex flex-col gap-4 p-8 rounded-\[32px\] bg-ground border border-black\/5 dark:border-white\/5"/g,
  'className="flex flex-col gap-4 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-ground border border-black/5 dark:border-white/5"'
);

// Partner section
content = content.replace(
  /className="px-6 py-20 border-t border-black\/5 dark:border-white\/10 bg-ground"/,
  'className="px-6 py-16 sm:py-20 border-t border-black/5 dark:border-white/10 bg-ground"'
);
content = content.replace(
  /className="flex flex-wrap justify-center gap-12 sm:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"/,
  'className="flex flex-wrap justify-center gap-8 sm:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"'
);

// Bottom CTA
content = content.replace(
  /className="px-6 py-24 flex flex-col items-center text-center bg-card border-t border-black\/5 dark:border-white\/10"/,
  'className="px-6 py-16 sm:py-24 flex flex-col items-center text-center bg-card border-t border-black/5 dark:border-white/10"'
);

// Footer
content = content.replace(
  /className="w-full bg-ground border-t border-black\/5 dark:border-white\/5 py-12 px-6"/,
  'className="w-full bg-ground border-t border-black/5 dark:border-white/5 py-8 sm:py-12 px-6"'
);
content = content.replace(
  /className="flex items-center gap-6 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"/,
  'className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"'
);

fs.writeFileSync(file, content);
