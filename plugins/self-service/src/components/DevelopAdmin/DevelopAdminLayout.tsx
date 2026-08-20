import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import {
  useNavIaModel,
  writeNavExperience,
} from '../../hooks/useNavIaModel';

/** Keep the Develop rail while these admin pages are open. */
export const DevelopAdminLayout = () => {
  const { experience, setExperience } = useNavIaModel();

  useEffect(() => {
    if (experience === 'develop') return;
    setExperience('develop');
    writeNavExperience('develop');
  }, [experience, setExperience]);

  return <Outlet />;
};
