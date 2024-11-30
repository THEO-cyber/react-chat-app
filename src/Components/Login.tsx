import React, { useEffect, useState } from "react";
import Input from "./input";
import Button from "./Button";
import { BE_signIn, BE_signUp, getStorageUser } from "../Backend/Queries";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../Redux/store";
import { authDataType } from "../Types";
import { setUser } from "../Redux/userSlice";

const Login = () => {
  const [login, setLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const goTo = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const usr = getStorageUser();

  useEffect(() => {
    if (usr?.id) {
      dispatch(setUser(usr));
      goTo("/dashboard");
    }
  }, []);

  const handleSignup = () => {
    const data = { email, password, confirmPassword };
    auth(data, BE_signUp, setSignUpLoading);
  };
  const handleSignin = () => {
    const data = { email, password };
    auth(data, BE_signIn, setSignInLoading);
  };

  const auth = (
    data: authDataType,
    func: any,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    func(data, setLoading, reset, goTo, dispatch);
  };

  const reset = () => {
    setEmail("");
    setpassword("");
    setconfirmPassword("");
  };

  return (
    <div className="w-full border-red-700 md:w-[450px]">
      <h1 className="text-white text-center font-bold  text-4xl md:text-6xl mb-10">
        {login ? "Login" : "Register"}
      </h1>

      <div className="flex flex-col gap-3 bg-white w-full p-6 min-h-[150px] rounded-xl drop-shadow-xl">
        <Input
          name=" Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          name=" Password"
          type="password"
          value={password}
          onChange={(e) => setpassword(e.target.value)}
        />
        {!login && (
          <Input
            name=" Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setconfirmPassword(e.target.value)}
          />
        )}
        {login ? (
          <>
            <Button
              text="Login"
              onClick={handleSignin}
              loading={signInLoading}
            />
            <Button onClick={() => setLogin(false)} text="Register" secondary />
          </>
        ) : (
          <>
            <Button
              text="Register"
              onClick={handleSignup}
              loading={signUpLoading}
            />
            <Button onClick={() => setLogin(true)} text="Login" secondary />
          </>
        )}
      </div>
    </div>
  );
};

export default Login;