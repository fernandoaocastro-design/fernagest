import React from 'react';
import { Link } from 'react-router-dom';
import { AppPermission } from '../utils/permissions';
import { useAuthorization } from '../utils/useAuthorization';

interface RouteGuardProps {
  required: AppPermission | readonly AppPermission[];
  children: React.ReactElement;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ required, children }) => {
  const { can, roleLabel } = useAuthorization();

  if (can(required)) return children;

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 className="text-xl font-bold text-red-900">Acesso negado</h1>
      <p className="mt-2 text-sm text-red-800">
        O seu perfil atual ({roleLabel}) nao possui permissao para abrir esta rota.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
};

export default RouteGuard;

