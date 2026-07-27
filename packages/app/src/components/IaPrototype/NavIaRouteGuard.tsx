import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavIaModel } from '@ansible/plugin-backstage-self-service';
import { mismatchedModelRedirect } from './navIaLandings';

/**
 * Keeps URL in sync with the selected IA model so Option 2 never shows
 * Option 3 Bridge / Option 1 Home content (and vice versa).
 */
export const NavIaRouteGuard = () => {
  const { model } = useNavIaModel();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const next = mismatchedModelRedirect(model, location.pathname);
    if (next && next !== location.pathname) {
      navigate(next, { replace: true });
    }
  }, [model, location.pathname, navigate]);

  return null;
};
