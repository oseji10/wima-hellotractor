// src/utils/auth.ts
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  applicationType: string | null;
  access_token: string;
  
}

export const getUserData = (): UserData | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
};

export const getApplicationType = (): string | null => {
  const user = getUserData();
  return user?.applicationType || null;
};

export const getRole = (): string | null => {
  const user = getUserData();
  return user?.role || null;
};

export const getUserName = (): string | null => {
  const user = getUserData();
  return user ? `${user.firstName} ${user.lastName}` : '';
}

export const getPhonePhoneNumber = (): string | null => {
  const user = getUserData();
  return user?.phoneNumber || null;
}

export const getUserEmail = (): string | null => {
  const user = getUserData();
  return user?.email || null;
}

