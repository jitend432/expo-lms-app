import type { Instructor } from '@/types/models/Instructor';

interface RandomUserResponse {
  gender: string;
  name: {
    title: string;
    first: string;
    last: string;
  };
  email: string;
  login: {
    uuid: string;
    username: string;
  };
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  location: {
    country: string;
    city: string;
  };
  registered: {
    date: string;
  };
}

export const transformRandomUserToInstructor = (
  randomUser: RandomUserResponse
): Instructor => {
  const fullName = `${randomUser.name.first} ${randomUser.name.last}`;
  
  // Generate expertise based on name length (just for demo)
  const expertiseOptions = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Cloud Computing',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design',
  ];
  
  const expertiseIndex = randomUser.name.first.length % expertiseOptions.length;
  
  return {
    id: randomUser.login.uuid,
    name: fullName,
    email: randomUser.email,
    avatar: randomUser.picture.large,
    thumbnail: randomUser.picture.thumbnail,
    title: `${randomUser.name.title} ${fullName}`,
    bio: `${fullName} is an experienced instructor specializing in ${expertiseOptions[expertiseIndex]}. With a passion for teaching and years of industry experience, they bring practical knowledge to every course.`,
    expertise: [expertiseOptions[expertiseIndex]],
    location: `${randomUser.location.city}, ${randomUser.location.country}`,
    joinedDate: randomUser.registered.date,
    totalStudents: Math.floor(Math.random() * 50000) + 1000,
    totalCourses: Math.floor(Math.random() * 20) + 1,
    rating: Number((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
    reviews: Math.floor(Math.random() * 5000) + 100,
    socialLinks: {
      twitter: `https://twitter.com/${randomUser.login.username}`,
      linkedin: `https://linkedin.com/in/${randomUser.login.username}`,
      github: `https://github.com/${randomUser.login.username}`,
    },
  };
};

// Transform multiple users
export const transformRandomUsersToInstructors = (
  randomUsers: RandomUserResponse[]
): Instructor[] => {
  return randomUsers.map(transformRandomUserToInstructor);
};