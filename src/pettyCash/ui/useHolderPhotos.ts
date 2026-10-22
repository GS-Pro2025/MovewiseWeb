import { useEffect, useState } from 'react';
import { fetchOperators } from '../../operators/data/RepositoryOperators';
import { getCompanyUsers } from '../../adminPanel/data/RepositoryAdmin';

/** Photos by id_operator and by admin person_id, for avatars next to fund holders. */
export const useHolderPhotos = () => {
  const [operators, setOperators] = useState<Record<number, string | null>>({});
  const [admins, setAdmins] = useState<Record<number, string | null>>({});

  useEffect(() => {
    fetchOperators()
      .then(r => setOperators(Object.fromEntries(r.results.map(o => [o.id_operator, o.photo]))))
      .catch(() => undefined);
    getCompanyUsers()
      .then(r => setAdmins(Object.fromEntries(r.data.map(a => [a.person_id, a.photo]))))
      .catch(() => undefined);
  }, []);

  return { operators, admins };
};
