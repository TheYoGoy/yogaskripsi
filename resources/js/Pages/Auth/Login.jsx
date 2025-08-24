import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout className="p-4">
            <Head title="Log in" />

            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-2">
                    Masuk
                </h2>
                <p className="text-gray-600">Akses Dashboard Anda</p>
            </div>

            {status && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-sm font-medium text-green-700 rounded-lg">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* Email Field */}
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Email Anda"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="admin@contoh.com"
                    />
                    <InputError
                        message={errors.email}
                        className="mt-2 text-sm text-red-600"
                    />
                </div>

                {/* Password Field */}
                <div>
                    <InputLabel
                        htmlFor="password"
                        value="Kata Sandi"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white"
                        autoComplete="current-password"
                        onChange={(e) => setData("password", e.target.value)}
                        placeholder="Masukan Kata Sandi"
                    />
                    <InputError
                        message={errors.password}
                        className="mt-2 text-sm text-red-600"
                    />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center group cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                        />
                        <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                            Ingatkan Saya
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route("password.request")}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-1 py-1 transition-colors"
                        >
                            Lupa Sandi?
                        </Link>
                    )}
                </div>

                {/* Login Button */}
                <div className="pt-2">
                    <PrimaryButton
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={processing}
                    >
                        {processing ? (
                            <div className="flex items-center justify-center">
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Memproses Dashboard...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                    />
                                </svg>
                                AKSES DASHBOARD
                            </div>
                        )}
                    </PrimaryButton>
                </div>
            </form>

            {/* Footer */}
        </GuestLayout>
    );
}
