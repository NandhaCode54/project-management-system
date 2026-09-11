import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { registerSchema } from '../schemas/authSchemas';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await registerUser(values);
      toast.success('Account created — welcome!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="card p-8">
      <h2 className="text-xl font-semibold text-slate-900">Create your account</h2>
      <p className="mt-1 text-sm text-slate-500">Start organizing projects within a minute.</p>

      {formError && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Full name" autoComplete="name" placeholder="Jane Doe" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 chars, letters + numbers"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          {!isSubmitting && <UserPlus className="h-4 w-4" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}