import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from "./layout/AppLayout";
import AuthPage from './components/auth/AuthPage';
import RolesList from './modules/roles/RolesList';
import RolesCreate from './modules/roles/RolesCreate';
import RolesEdit from './modules/roles/RolesEdit';
import RolesShow from './modules/roles/RolesShow';
import PermissionsList from './modules/permissions/PermissionsList';
import PermissionsCreate from './modules/permissions/PermissionsCreate';
import PermissionsEdit from './modules/permissions/PermissionsEdit';
import PermissionsShow from './modules/permissions/PermissionsShow';
import RolePermissionsList from './modules/role_permissions/RolePermissionsList';
import RolePermissionsCreate from './modules/role_permissions/RolePermissionsCreate';
import RolePermissionsEdit from './modules/role_permissions/RolePermissionsEdit';
import RolePermissionsShow from './modules/role_permissions/RolePermissionsShow';
import UsersList from './modules/users/UsersList';
import UsersCreate from './modules/users/UsersCreate';
import UsersEdit from './modules/users/UsersEdit';
import UsersShow from './modules/users/UsersShow';
import UserRolesList from './modules/user_roles/UserRolesList';
import UserRolesCreate from './modules/user_roles/UserRolesCreate';
import UserRolesEdit from './modules/user_roles/UserRolesEdit';
import UserRolesShow from './modules/user_roles/UserRolesShow';
import ProjectsList from './modules/projects/ProjectsList';
import ProjectsCreate from './modules/projects/ProjectsCreate';
import ProjectsEdit from './modules/projects/ProjectsEdit';
import ProjectsShow from './modules/projects/ProjectsShow';
import ProjectMembersList from './modules/project_members/ProjectMembersList';
import ProjectMembersCreate from './modules/project_members/ProjectMembersCreate';
import ProjectMembersEdit from './modules/project_members/ProjectMembersEdit';
import ProjectMembersShow from './modules/project_members/ProjectMembersShow';
import TasksList from './modules/tasks/TasksList';
import TasksCreate from './modules/tasks/TasksCreate';
import TasksEdit from './modules/tasks/TasksEdit';
import TasksShow from './modules/tasks/TasksShow';
import CommentsList from './modules/comments/CommentsList';
import CommentsCreate from './modules/comments/CommentsCreate';
import CommentsEdit from './modules/comments/CommentsEdit';
import CommentsShow from './modules/comments/CommentsShow';
import TimeLogsList from './modules/time_logs/TimeLogsList';
import TimeLogsCreate from './modules/time_logs/TimeLogsCreate';
import TimeLogsEdit from './modules/time_logs/TimeLogsEdit';
import TimeLogsShow from './modules/time_logs/TimeLogsShow';
import AttachmentsList from './modules/attachments/AttachmentsList';
import AttachmentsCreate from './modules/attachments/AttachmentsCreate';
import AttachmentsEdit from './modules/attachments/AttachmentsEdit';
import AttachmentsShow from './modules/attachments/AttachmentsShow';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import EditProfile from './pages/EditProfile';
import AccountSettings from './pages/AccountSettings';
import { tokenManager } from './services/api';
import ProjectTasks from './modules/projects/ProjectTasks';
import AuditLogsList from './modules/audit_logs/AuditLogsList';
import ExecutiveReport from './pages/ExecutiveReport';
import AdminReports from './pages/AdminReports';
import DeveloperDashboard from './components/DeveloperDashboard';
import { useCurrentUser } from './context/CurrentUserContext';

// ProtectedRoute: Prevents authenticated users from accessing login page
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = tokenManager.isAuthenticated();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// PrivateRoute: Protects dashboard and other routes, redirects unauthenticated users to login
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { userRole } = useCurrentUser();
  return (
    <Routes>
      {/* Public route for authentication */}
      <Route
        path="/auth"
        element={
          <ProtectedRoute>
            <AuthPage />
          </ProtectedRoute>
        }
      />
      {/* Public route for forgot password */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected routes under AppLayout */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index path="/" element={
          userRole && userRole.toLowerCase().includes('developer')
            ? <Navigate to="/developer-dashboard" replace />
            : <Dashboard />
        } />
        <Route path="/developer-dashboard" element={<DeveloperDashboard />} />
        <Route path="/roles" element={<RolesList moduleName='roles' />} />
        <Route path="/roles/create" element={<RolesCreate moduleName='roles' />} />
        <Route path="/roles/edit/:id" element={<RolesEdit moduleName='roles' />} />
        <Route path="/roles/show/:id" element={<RolesShow moduleName='roles' />} />
        <Route path="/permissions" element={<PermissionsList moduleName='permissions' />} />
        <Route path="/permissions/create" element={<PermissionsCreate moduleName='permissions' />} />
        <Route path="/permissions/edit/:id" element={<PermissionsEdit moduleName='permissions' />} />
        <Route path="/permissions/show/:id" element={<PermissionsShow moduleName='permissions' />} />
        <Route path="/role_permissions" element={<RolePermissionsList moduleName='role_permissions' />} />
        <Route path="/role_permissions/create" element={<RolePermissionsCreate moduleName='role_permissions' />} />
        <Route path="/role_permissions/edit/:id" element={<RolePermissionsEdit moduleName='role_permissions' />} />
        <Route path="/role_permissions/show/:id" element={<RolePermissionsShow moduleName='role_permissions' />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/create" element={<UsersCreate />} />
        <Route path="/users/edit/:id" element={<UsersEdit />} />
        <Route path="/users/show/:id" element={<UsersShow moduleName='users' />} />
        <Route path="/user_roles" element={<UserRolesList />} />
        <Route path="/user_roles/create" element={<UserRolesCreate />} />
        <Route path="/user_roles/edit/:id" element={<UserRolesEdit />} />
        <Route path="/user_roles/show/:id" element={<UserRolesShow />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/create" element={<ProjectsCreate />} />
        <Route path="/projects/edit/:id" element={<ProjectsEdit />} />
        <Route path="/projects/show/:id" element={<ProjectsShow />} />
        <Route path="/projects/:id/tasks" element={<ProjectTasks />} />
        <Route path="/project_members" element={<ProjectMembersList />} />
        <Route path="/project_members/create" element={<ProjectMembersCreate />} />
        <Route path="/project_members/edit/:id" element={<ProjectMembersEdit />} />
        <Route path="/project_members/show/:id" element={<ProjectMembersShow />} />
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/tasks/create" element={<TasksCreate />} />
        <Route path="/tasks/create/:id" element={<TasksCreate />} />
        <Route path="/tasks/edit/:id" element={<TasksEdit />} />
        <Route path="/tasks/show/:id" element={<TasksShow moduleName='tasks' />} />
        <Route path="/comments" element={<CommentsList moduleName='comments' />} />
        <Route path="/comments/create" element={<CommentsCreate moduleName='comments' />} />
        <Route path="/comments/edit/:id" element={<CommentsEdit moduleName='comments' />} />
        <Route path="/comments/show/:id" element={<CommentsShow moduleName='comments' />} />
        <Route path="/time_logs" element={<TimeLogsList />} />
        <Route path="/time_logs/create" element={<TimeLogsCreate />} />
        <Route path="/time_logs/edit/:id" element={<TimeLogsEdit />} />
        <Route path="/time_logs/show/:id" element={<TimeLogsShow moduleName='time_logs' />} />
        <Route path="/attachments" element={<AttachmentsList moduleName='attachments' />} />
        <Route path="/attachments/create" element={<AttachmentsCreate moduleName='attachments' />} />
        <Route path="/attachments/edit/:id" element={<AttachmentsEdit moduleName='attachments' />} />
        <Route path="/attachments/show/:id" element={<AttachmentsShow moduleName='attachments' />} />
        <Route path="/audit-logs" element={<AuditLogsList />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/reports/executive" element={<ExecutiveReport />} />
        <Route path="/reports/admin" element={<AdminReports />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;