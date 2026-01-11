import Router from "next/router";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import authConfig from "@/configs/auth";

export const useAuth = () => useContext(AuthContext);
export const logout: () => void = () => {
  localStorage.removeItem(authConfig.loginStateTokenName);
  Router.push("/auth");
};
