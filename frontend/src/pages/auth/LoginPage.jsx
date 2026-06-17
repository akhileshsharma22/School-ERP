import AuthBanner from "../../components/auth/AuthBanner";
import LoginForm from "../../components/auth/LoginForm";

const 
LoginPage = () => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100">
      <AuthBanner />
      <LoginForm />
    </div>
  );
};

export default LoginPage;