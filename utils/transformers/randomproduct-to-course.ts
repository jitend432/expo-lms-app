import type { Course } from '@/types/models/Course';
import type { Instructor } from '@/types/models/Instructor';

interface RandomProductResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

const categoryMapping: Record<string, string> = {
  smartphones: 'Mobile Development',
  laptops: 'Programming',
  fragrances: 'Lifestyle',
  skincare: 'Health & Wellness',
  groceries: 'Cooking',
  'home-decoration': 'Interior Design',
  furniture: 'DIY & Crafts',
  tops: 'Fashion Design',
  'womens-dresses': 'Fashion Design',
  'womens-shoes': 'Fashion Design',
  'mens-shirts': 'Fashion Design',
  'mens-shoes': 'Fashion Design',
  'mens-watches': 'Accessories',
  'womens-watches': 'Accessories',
  'womens-bags': 'Accessories',
  'womens-jewellery': 'Accessories',
  sunglasses: 'Accessories',
  automotive: 'Automotive',
  motorcycle: 'Automotive',
  lighting: 'Home Improvement',
};

const levelMapping = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export const transformRandomProductToCourse = (
  product: RandomProductResponse,
  instructor: Instructor
): Course => {
  // Calculate discounted price
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  
  // Map product category to course category
  const courseCategory = categoryMapping[product.category] || 'General';
  
  // Determine course level based on price and rating
  let level: typeof levelMapping[number];
  if (product.price < 50) {
    level = 'Beginner';
  } else if (product.price < 200) {
    level = 'Intermediate';
  } else if (product.price < 500) {
    level = 'Advanced';
  } else {
    level = 'Expert';
  }
  
  // Generate course duration based on price (1-40 hours)
  const duration = Math.floor(product.price / 10) + 1;
  
  // Generate enrollment count based on stock
  const enrolledCount = product.stock * 10;
  
  return {
    id: `course-${product.id}`,
    title: `${product.brand} - ${product.title}`,
    description: `${product.description} This comprehensive course will take you from basics to advanced concepts with hands-on projects and real-world examples.`,
    shortDescription: product.description.slice(0, 100) + '...',
    thumbnail: product.thumbnail,
    coverImage: product.images[0] || product.thumbnail,
    price: product.price,
    discountedPrice: product.discountPercentage > 0 ? discountedPrice : undefined,
    discountPercentage: product.discountPercentage,
    category: courseCategory,
    level,
    duration, // in hours
    totalLessons: Math.floor(duration * 3), // ~3 lessons per hour
    totalQuizzes: Math.floor(Math.random() * 10) + 2,
    totalAssignments: Math.floor(Math.random() * 5) + 1,
    rating: product.rating,
    totalReviews: Math.floor(Math.random() * 10000) + 100,
    enrolledCount,
    instructor: {
      id: instructor.id,
      name: instructor.name,
      avatar: instructor.avatar,
      title: instructor.title,
    },
    tags: [product.brand, product.category, level],
    learningOutcomes: [
      `Master ${product.title} fundamentals`,
      `Build real-world projects with ${product.brand}`,
      `Learn industry best practices`,
      `Get hands-on experience with practical exercises`,
    ],
    prerequisites: level === 'Beginner' 
      ? ['Basic computer skills'] 
      : [`Basic knowledge of ${courseCategory}`, 'Willingness to learn'],
    language: 'English',
    subtitles: ['English', 'Spanish', 'French'],
    lastUpdated: new Date().toISOString(),
    isPublished: true,
    isFeatured: product.rating > 4.5,
    isBookmarked: false,
    isEnrolled: false,
    progress: 0,
    certificateAvailable: product.price > 100,
  };
};

// Transform multiple products
export const transformRandomProductsToCourses = (
  products: RandomProductResponse[],
  instructors: Instructor[]
): Course[] => {
  return products.map((product, index) => {
    const instructor = instructors[index % instructors.length];
    return transformRandomProductToCourse(product, instructor);
  });
};