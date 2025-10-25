import { logout } from '@/lib/auth/actions';

export async function GET() {
    await logout();
}