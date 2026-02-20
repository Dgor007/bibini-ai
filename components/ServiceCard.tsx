import Link from 'next/link';

interface ServiceCardProps {
  icon: string;
  title: string;
  price: string;
  href: string;
}

export default function ServiceCard({ icon, title, price, href }: ServiceCardProps) {
  return (
    <div
      className="relative z-0 rounded-2xl p-8 border border-transparent hover:border-gold transition-all cursor-pointer"
      style={{ background: 'rgba(198, 161, 91, 0.05)', backdropFilter: 'blur(10px)' }}
    >
      <span className="text-4xl mb-6 block">{icon}</span>
      <h3 className="font-serif text-2xl font-bold text-champagne mb-3">{title}</h3>
      <p className="text-gold font-serif text-2xl mb-6">{price}</p>
      <Link href={href} className="text-gold hover:text-gold-dark font-semibold">
        Learn More →
      </Link>
    </div>
  );
}
