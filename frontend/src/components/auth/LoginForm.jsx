import { useState } from "react";
import {
    Eye,
    EyeOff,
    ShieldCheck,
    Loader2,
} from "lucide-react";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";
import { loginSuccess } from "../../redux/slices/authSlice";

const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [role, setRole] =
        useState("ADMIN");

    const [formData, setFormData] =
        useState({
            identifier: "",
            password: "",
        });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]:
                e.target.value,
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            console.log("Sending Data:", {
                identifier: formData.identifier,
                password: formData.password,
                role,
            });

            const response = await loginUser({
                identifier: formData.identifier,
                password: formData.password,
                role,
            });

            console.log("API Response:", response);

            dispatch(loginSuccess(response));

            navigate("/dashboard");

        } catch (err) {
            console.log("Login Error:", err);
            console.log("Response:", err?.response);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Login Failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 p-8">

            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="text-white" />

                    <span className="text-white font-semibold">
                        Secure Login
                    </span>
                </div>

                <h1 className="text-4xl font-bold text-white">
                    Welcome Back
                </h1>

                <p className="text-blue-100 mt-2 mb-8">
                    Sign in to continue
                </p>

                <div className="grid grid-cols-3 bg-white/10 rounded-xl p-1 mb-6">

                    {[
                        "ADMIN",
                        "STAFF",
                        "PARENT",
                    ].map((item) => (
                        <button
                            type="button"
                            key={item}
                            onClick={() =>
                                setRole(item)
                            }
                            className={`py-2 rounded-lg text-sm font-medium transition-all ${role === item
                                ? "bg-white text-blue-700"
                                : "text-white"
                                }`}
                        >
                            {item}
                        </button>
                    ))}

                </div>

                <form
                    onSubmit={handleLogin}
                    className="space-y-4"
                >

                    <input
                        type="text"
                        name="identifier"
                        value={
                            formData.identifier
                        }
                        onChange={
                            handleChange
                        }
                        placeholder={
                            role === "PARENT"
                                ? "Admission Number"
                                : "Email Address"
                        }
                        className="w-full h-12 rounded-xl px-4 bg-white text-slate-700 outline-none"
                        required
                    />

                    <div className="relative">

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Password"
                            className="w-full h-12 rounded-xl px-4 bg-white text-slate-700 outline-none"
                            required
                        />

                        <button
                            type="button"
                            className="absolute right-4 top-3"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                        >
                            {showPassword ? (
                                <EyeOff />
                            ) : (
                                <Eye />
                            )}
                        </button>

                    </div>

                    {error && (
                        <div className="text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between text-sm text-white">

                        <label className="flex gap-2">
                            <input type="checkbox" />
                            Remember Me
                        </label>

                        <button
                            type="button"
                        >
                            Forgot Password?
                        </button>

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-white text-blue-700 font-semibold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >

                        {loading ? (
                            <>
                                <Loader2
                                    className="animate-spin"
                                    size={18}
                                />
                                Logging In...
                            </>
                        ) : (
                            "Sign In"
                        )}

                    </button>

                </form>

            </div>

        </div>
    );
};

export default LoginForm;