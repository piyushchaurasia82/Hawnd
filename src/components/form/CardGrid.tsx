import React from 'react';

interface CardItem {
    title: string;
    desc: string;
    img: string;
    url: string;
}

interface CardGridProps {
    items: CardItem[];
}

const CardGrid: React.FC<CardGridProps> = ({ items }) => {
    return (
        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-md text-left h-full">
                    <a key={idx} href={item.url} >
                        <img src={item.img} alt={item.title} className="w-full h-52 object-contain bg-white p-6" />
                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                    </a>
                </div>
            ))}
        </div>
    );
};

export default CardGrid;
