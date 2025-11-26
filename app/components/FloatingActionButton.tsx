import Image from "next/image";

type FloatingActionButtonProps = {
  href: string;
};

export default function FloatingActionButton({ href }: FloatingActionButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-white text-white p-4 rounded-full shadow-lg hover:bg-gray-3gem00 transition-colors flex items-center justify-center"
      aria-label="View Source Code"
    >
      <Image src="./github.svg" alt="GitHub" width={24} height={24} className="" />
    </a>
  );
}