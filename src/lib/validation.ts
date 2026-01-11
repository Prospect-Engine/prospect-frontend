export const validateEmail = (email: string): boolean => {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  }
  return false;
};

export const validatePassword = (password: string): boolean => {
  const minPasswordLegnth = 4;
  return !!password && password.length >= minPasswordLegnth;
};
