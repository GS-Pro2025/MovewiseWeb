import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { decodeJWTAsync } from '../../service/tokenDecoder';
import { fetchUserProfile } from '../../service/userService';

export interface PettyCashUser {
  personId: number | null;
  isSuper: boolean;
  loading: boolean;
}

/** Current admin's person id (from the JWT) and super-admin flag (from the profile). */
export const usePettyCashUser = (): PettyCashUser => {
  const [state, setState] = useState<PettyCashUser>({ personId: null, isSuper: false, loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const payload = await decodeJWTAsync(Cookies.get('authToken') ?? '');
        const personId = Number(payload?.person_id);
        if (!personId) throw new Error('no person id');
        const profile = await fetchUserProfile(personId);
        if (alive) setState({ personId, isSuper: !!profile.is_superUser, loading: false });
      } catch {
        if (alive) setState({ personId: null, isSuper: false, loading: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  return state;
};
