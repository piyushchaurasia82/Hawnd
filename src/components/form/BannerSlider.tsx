import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/swiper-bundle.css';

interface Thought {
    thought?: string;
    quote?: string;
    author?: string;
    imageUrl: string;
    bgColor?: string;
    textColor?: string;
}

interface BannerSliderProps {
    data: Thought[];
}

const BannerSlider = ({ data }: BannerSliderProps) => {
    return (
        <div className="max-w-6xl mx-auto my-12 px-6">
            <Swiper
                modules={[Autoplay]}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={true}
            >
                {data.map((thought, index) => {
                    const isSimpleImage = !thought.quote && !thought.author && !thought.thought;
                    return (
                        <SwiperSlide key={index}>
                            {isSimpleImage ? (
                                // If no text → only image full width
                                <div className="flex justify-center items-center">
                                    <img 
                                        src={thought.imageUrl} 
                                        alt="Banner Visual" 
                                        className="w-full object-contain"
                                    />
                                </div>
                            ) : (
                                // If text exists → full styled card
                                <div 
                                    className="rounded-xl p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-md"
                                    style={{ backgroundColor: thought.bgColor, color: thought.textColor }}
                                >
                                    <div className="text-left max-w-2xl">
                                        {thought.thought && (
                                            <h2 className="text-4xl font-bold mb-6">{thought.thought}</h2>
                                        )}
                                        {thought.quote && (
                                            <blockquote className="text-xl italic font-medium">
                                                “{thought.quote}”
                                            </blockquote>
                                        )}
                                        {thought.author && (
                                            <p className="mt-4 font-semibold text-lg italic">- {thought.author}</p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <img 
                                            src={thought.imageUrl} 
                                            alt="Banner Visual" 
                                            className="w-48 h-48 object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
};

export default BannerSlider;
