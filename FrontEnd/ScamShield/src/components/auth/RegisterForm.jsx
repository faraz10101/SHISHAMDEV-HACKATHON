import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  UserPlus,
  Check,
} from 'lucide-react';

export default function RegisterForm({ onRegisterSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Code was emailed -> go to the verification screen
      onRegisterSuccess(response.email || formData.email.trim().toLowerCase());
      navigate('/verify');
    } catch (err) {
      // 429: a code was just sent, so the user can still continue to the code screen
      if (err.status === 429 && err.email) {
        onRegisterSuccess(err.email);
        navigate('/verify');
        return;
      }
      setError(
        err.message ||
        'Something went wrong during registration.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#f8fafc]">

      {/* =========================
          BACKGROUND DECORATION
      ========================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div
          className="
            absolute
            -left-32
            -top-32
            h-64
            w-64
            rounded-full
            bg-primary/10
            blur-3xl
            sm:-left-40
            sm:-top-40
            sm:h-80
            sm:w-80
          "
        />

        <div
          className="
            absolute
            -bottom-32
            -right-32
            h-64
            w-64
            rounded-full
            bg-primary/10
            blur-3xl
            sm:-bottom-40
            sm:-right-40
            sm:h-80
            sm:w-80
          "
        />

      </div>

      {/* =========================
          MAIN CONTAINER
      ========================== */}
      <div
        className="
          relative
          flex
          min-h-[100dvh]
          w-full
          items-center
          justify-center
          px-4
          py-6
          sm:px-6
          sm:py-10
          lg:px-8
        "
      >

        <div className="w-full max-w-[470px]">

          {/* =========================
              BRAND
          ========================== */}
          <div className="mb-6 text-center sm:mb-8">

            <div
              className="
                mx-auto
                mb-3
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-primary
                text-primary-foreground
                shadow-lg
                shadow-primary/20
                sm:mb-4
                sm:h-14
                sm:w-14
              "
            >
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
                sm:text-3xl
              "
            >
              Create your account
            </h1>

            <p
              className="
                mx-auto
                mt-1.5
                max-w-xs
                text-xs
                leading-relaxed
                text-slate-500
                sm:mt-2
                sm:max-w-none
                sm:text-sm
              "
            >
              Join us and get started in just a few seconds
            </p>

          </div>

          {/* =========================
              REGISTER CARD
          ========================== */}
          <Card
            className="
              w-full
              overflow-hidden
              border-0
              bg-white
              shadow-xl
              shadow-slate-200/70
              ring-1
              ring-slate-200/70
            "
          >

            {/* HEADER */}
            <CardHeader
              className="
                space-y-1
                px-5
                pb-5
                pt-5
                sm:px-6
                sm:pb-6
                sm:pt-6
              "
            >

              <CardTitle
                className="
                  text-lg
                  font-semibold
                  text-slate-900
                  sm:text-xl
                "
              >
                Sign up
              </CardTitle>

              <CardDescription
                className="
                  text-xs
                  leading-relaxed
                  text-slate-500
                  sm:text-sm
                "
              >
                Enter your information to create your account.
              </CardDescription>

            </CardHeader>

            <form onSubmit={handleSubmit}>

              {/* CONTENT */}

              <CardContent
                className="
                  space-y-4
                  px-5
                  sm:space-y-5
                  sm:px-6
                "
              >

                {/* ERROR */}
                {error && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-3.5
                      py-2.5
                      text-xs
                      font-medium
                      leading-relaxed
                      text-red-600
                      sm:px-4
                      sm:py-3
                      sm:text-sm
                    "
                  >
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {success && (
                  <div
                    className="
                      flex
                      items-start
                      gap-2.5
                      rounded-xl
                      border
                      border-emerald-200
                      bg-emerald-50
                      px-3.5
                      py-2.5
                      text-xs
                      font-medium
                      leading-relaxed
                      text-emerald-600
                      sm:gap-3
                      sm:px-4
                      sm:py-3
                      sm:text-sm
                    "
                  >
                    <Check
                      className="
                        mt-0.5
                        h-4
                        w-4
                        shrink-0
                      "
                    />

                    <span>{success}</span>
                  </div>
                )}

                  {/* USERNAME */}
                  <div className="space-y-1.5 sm:space-y-2">

                    <Label
                      htmlFor="username"
                      className="
                      text-xs
                      font-medium
                      text-slate-700
                      sm:text-sm
                      "
                    >
                      Username
                    </Label>

                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Alex"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border-slate-200
                        bg-slate-50/50
                        px-3.5
                        text-sm
                        transition-all
                        placeholder:text-slate-400
                        focus:bg-white
                        focus:ring-2
                        focus:ring-primary/20
                        sm:px-4
                      "
                    />

                  </div>

                {/* EMAIL */}
                <div className="space-y-1.5 sm:space-y-2">

                  <Label
                    htmlFor="email"
                    className="
                      text-xs
                      font-medium
                      text-slate-700
                      sm:text-sm
                    "
                  >
                    Email Address
                  </Label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border-slate-200
                      bg-slate-50/50
                      px-3.5
                      text-sm
                      transition-all
                      placeholder:text-slate-400
                      focus:bg-white
                      focus:ring-2
                      focus:ring-primary/20
                      sm:px-4
                    "
                  />

                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5 sm:space-y-2">

                  <Label
                    htmlFor="password"
                    className="
                      text-xs
                      font-medium
                      text-slate-700
                      sm:text-sm
                    "
                  >
                    Password
                  </Label>

                  <div className="relative">

                    <Input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border-slate-200
                        bg-slate-50/50
                        px-3.5
                        pr-11
                        text-sm
                        transition-all
                        placeholder:text-slate-400
                        focus:bg-white
                        focus:ring-2
                        focus:ring-primary/20
                        sm:px-4
                      "
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="
                        absolute
                        right-2.5
                        top-1/2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400
                        transition-colors
                        hover:bg-slate-100
                        hover:text-slate-700
                        sm:right-3
                      "
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                  </div>

                  <p className="text-[11px] text-slate-400 sm:text-xs">
                    Use at least 6 characters.
                  </p>

                </div>


                {/* CONFIRM PASSWORD */}
                <div className="space-y-1.5 sm:space-y-2">

                  <Label
                    htmlFor="confirmPassword"
                    className="
                      text-xs
                      font-medium
                      text-slate-700
                      sm:text-sm
                    "
                  >
                    Confirm Password
                  </Label>

                  <div className="relative">

                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border-slate-200
                        bg-slate-50/50
                        px-3.5
                        pr-11
                        text-sm
                        transition-all
                        placeholder:text-slate-400
                        focus:bg-white
                        focus:ring-2
                        focus:ring-primary/20
                        sm:px-4
                      "
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="
                        absolute
                        right-2.5
                        top-1/2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400
                        transition-colors
                        hover:bg-slate-100
                        hover:text-slate-700
                        sm:right-3
                      "
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                  </div>

                </div>

              </CardContent>


              {/* FOOTER */}

              <CardFooter
                className="
                  flex
                  flex-col
                  gap-4
                  px-5
                  pb-5
                  pt-5
                  sm:gap-5
                  sm:px-6
                  sm:pb-6
                  sm:pt-6
                "
              >

                {/* REGISTER BUTTON */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    h-11
                    w-full
                    rounded-xl
                    text-sm
                    font-semibold
                    shadow-md
                    shadow-primary/20
                    transition-all
                    hover:-translate-y-[1px]
                    hover:shadow-lg
                    hover:shadow-primary/25
                    active:translate-y-0
                  "
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* DIVIDER */}
                <div className="relative w-full">

                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>

                  <div className="relative flex justify-center text-[11px] sm:text-xs">
                    <span className="bg-white px-3 text-slate-400">
                      Already registered?
                    </span>
                  </div>

                </div>

                {/* LOGIN */}
                <Link
                  to="/login"
                  className="
                    min-h-9
                    text-xs
                    font-semibold
                    text-primary
                    transition-colors
                    hover:underline
                    sm:text-sm
                  "
                >
                  Sign in to your account
                </Link>

              </CardFooter>
            </form>
          </Card>

          {/* FOOTER */}

          <p
            className="
              mx-auto
              mt-4
              max-w-sm
              px-2
              text-center
              text-[10px]
              leading-relaxed
              text-slate-400
              sm:mt-6
              sm:text-xs
            "
          >
            By creating an account, you agree to our Terms of
            Service and Privacy Policy.
          </p>

        </div>
      </div>
    </main>
  );
}
