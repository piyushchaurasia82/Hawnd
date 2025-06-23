import React from 'react';

interface CardItem {
  title: string;
  desc: string;
  img: string;
  url: string;
}

interface LearningCardGridProps {
  items: CardItem[];
}

const LearningCardGrid: React.FC<LearningCardGridProps> = ({ items }) => {
  return (
    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity duration-200 hover:opacity-40"
        >
          <div className="bg-white p-6 rounded-lg shadow-md text-left h-full">
            <img src={item.img} alt={item.title} className="h-10 w-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default LearningCardGrid;
