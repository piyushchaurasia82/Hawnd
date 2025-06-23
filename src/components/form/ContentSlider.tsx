import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import 'swiper/swiper-bundle.css';
import { useRef } from 'react';
import { useNavigate } from 'react-router';

interface ContentSliderProps {
    data: Array<{
        image: string;
        title: string;
        description: string;
        url: string;
    }>;
    position: string;
    onItemClick?: (url: string) => void; // Optional callback for item click
}

const ContentSlider = ({ data, position, onItemClick }: ContentSliderProps) => {
    const navigate = useNavigate();
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    const handleCardClick = (url: string) => {
        // Navigate based on 'key'
        if (position == 'outside') {
            window.open(url, '_blank'); // Internal navigation
        } else if (position === 'inside' && onItemClick) {
            onItemClick(url); // Trigger onItemClick for dialog in Canva
        } else {
            navigate(url); // Internal navigation
        }
    };

    return (
        <div className="relative max-w-6xl mx-auto px-4">
            {data.length > 3 && (
                <>
                    {/* Arrows */}
                    <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 z-10">
                        <button ref={prevRef} className="text-white hover:text-blue-800 bg-blue-400 hover:bg-white rounded-2xl p-2">
                            <FaArrowLeft />
                        </button>
                    </div>
                    <div className="absolute -right-5 top-1/2 transform -translate-y-1/2 z-10">
                        <button ref={nextRef} className="text-white hover:text-blue-800 bg-blue-400 hover:bg-white rounded-2xl p-2">
                            <FaArrowRight />
                        </button>
                    </div>
                </>
            )}

            {/* Swiper */}
            <Swiper
                modules={[Navigation, Autoplay]}
                onInit={(swiper:any) => {
                    swiper.params.navigation.prevEl = prevRef.current;
                    swiper.params.navigation.nextEl = nextRef.current;
                    swiper.navigation.init();
                    swiper.navigation.update();
                }}
                slidesPerView={3}
                slidesPerGroup={3}
                loop={true}
                spaceBetween={24}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                breakpoints={{
                    1280: { slidesPerView: 3, slidesPerGroup: 3 },
                    768: { slidesPerView: 2, slidesPerGroup: 2 },
                    0: { slidesPerView: 1, slidesPerGroup: 1 },
                }}
            >
                {data.map((item, index) => (
                    <SwiperSlide key={index}>
                        <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                            onClick={() => handleCardClick(item.url)}
                        >
                            <div className="relative h-48 w-full mb-4 overflow-hidden rounded-lg">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="object-cover h-full w-full transition-transform duration-300 hover:scale-105"
                                />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.title}</h3>
                            <p className="text-sm text-gray-600 flex-grow">{item.description}</p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default ContentSlider;
