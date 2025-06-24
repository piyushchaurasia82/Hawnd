import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/swiper-bundle.css'; // Import Swiper styles
import { useNavigate } from 'react-router';

const sliderData = [
  {
    title: 'Countingwell',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/countingwell.png',
  },
  {
    title: 'EdPrime Scholarships',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/edprime-scholarships.jpg',
  },
  {
    title: 'Edprime Teacher Wellness',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/edprime-teacher.jpg',
  },
  {
    title: 'EdPrime Scholarships',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/course_image_2.jpg',
  },
  {
    title: 'EdPrime Scholarships',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/Edprime_Exclusive_July06.png',
  },
  {
    title: 'EdPrime Scholarships',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/May_Edprime_Exclusive_Banner_1.jpg',
  },
  {
    title: 'EdPrime Scholarships',
    description:
      'Wellness of teachers is equally important & is linked to the effectiveness of teaching. The objective is free exchange of knowledge & can always use this as a digital resource to seek information',
    image: '/images/edprime-exclusive/May_Edprime_Exclusive_Banner_2.jpg',
  }
];

const EdprimeSlider = () => {

  const navigate = useNavigate();

  const handleExploreEdprimeExclusiveClick = () => {
    navigate("/edprime-exclusive")
  }

  return (
    <div className="bg-gray-50 py-6 px-4 sm:px-6 rounded-xl mx-auto max-w-7xl">
      <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">EdPrime Exclusive</h2>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={24}
        slidesPerView={3}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        breakpoints={{
          1280: { slidesPerView: 3, spaceBetween: 24 },
          768: { slidesPerView: 2, spaceBetween: 16 },
          0: { slidesPerView: 1, spaceBetween: 8 },
        }}
        className="pb-12"
      >
        {sliderData.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-48 w-full mb-4 overflow-hidden rounded-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover h-full w-full transition-transform duration-300 hover:scale-105"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.title}</h3>
              <p className="text-sm text-gray-600 flex-grow">{item.description}</p>
              <button className="mt-4 text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Learn More
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="mt-6 text-center">
        <button className="bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          onClick={handleExploreEdprimeExclusiveClick}
        >
          Explore Edprime Exclusive
        </button>
      </div>
    </div>
  );
};

export default EdprimeSlider;