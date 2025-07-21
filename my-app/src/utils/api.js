import { useState, useEffect } from 'react';

// --- FORMS ---

export async function getForm() {
  const res = await fetch(`/api/forms/get-form`);
  return res.json();
}

export async function insertForm() {
  const res = await fetch('/api/forms/insert-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function updateForm(form) {
  const res = await fetch(`/api/forms/update-form?id=${form.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  return res.json();
}


// --- PROJECTS ---
export async function getProjects() {
  const res = await fetch(`/api/projects/get-project`);
  return res.json();
}

export async function getProject(id) {
  const res = await fetch(`/api/projects/update-project?id=${id}`);
  return res.json();
}

export async function insertProject(project) {
  const res = await fetch('/api/projects/insert-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: project })
  });
  return res.json();
}

async function updateProject(project) {
  const res = await fetch(`/api/projects/update-project?id=${project.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: project.fields })
  });
  return res.json();
}

async function updateProjectFieldsVisibility({ key, visible }) {
  const res = await fetch('/api/projects/update-projects', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, visible }),
  });
  return res.json();
}

// --- LINKS ---
export async function getLinks() {
  const res = await fetch(`/api/links/get-link`);
  return res.json();
}

export async function insertLink(link) {
  const res = await fetch('/api/links/insert-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: link })
  });
  return res.json();
}

export async function updateLink(link) {
  const res = await fetch(`/api/links/update-link?id=${link.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(link),
  });
  return res.json();
}

export async function getLink(id) {
  const res = await fetch(`/api/links/update-link?id=${id}`);
  return res.json();
}

// --- FINANCES ---
export async function getFinances() {
  const res = await fetch(`/api/finances/get-finance`);
  return res.json();
}

export async function getFinance(id) {
  const res = await fetch(`/api/finances/update-finance?id=${id}`);
  return res.json();
}

export async function insertFinance(finance) {
  const res = await fetch('/api/finances/insert-finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: finance.fields, type: finance.type })
  });
  return res.json();
}

export async function updateFinance(finance) {
  const res = await fetch(`/api/finances/update-finance?id=${finance.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: finance.fields, type: finance.type })
  });
  return res.json();
}

export async function deleteFinance(id) {
  const res = await fetch(`/api/finances/delete-finance?id=${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

// --- PROFILES ---
export async function getProfile() {
  const res = await fetch(`/api/profiles/get-profile`);
  return res.json();
}

export async function updateProfile(profile) {
  const res = await fetch('/api/profiles/update-profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  return res.json();
}

// Main API Call Functions
export function MakeGetRequest(apiFunction) {
  return function useCustomGetHook() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      apiFunction()
        .then(result => {
          setData(result);
          setError(null);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
  };
}

export function MakeGetRequestWithParams(apiFunction) {
  return function useCustomGetWithParamsHook(param) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!param) return;
      setLoading(true);
      apiFunction(param)
        .then(result => {
          setData(result);
          setError(null);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }, [param]);

    return { data, loading, error };
  };
}

export function MakeUpdateRequest(apiFunction) {
  return function useCustomUpdateHook() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    };

    return { mutate, data, loading, error };
  };
}

export function MakeUpdateRequests(apiFunction) {
  return function useCustomUpdateRequestsHook() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async (argsArray) => {
      setLoading(true);
      setError(null);
      try {
        // argsArray should be an array of arguments for apiFunction
        const results = await Promise.all(
          argsArray.map(args => apiFunction(...[].concat(args)))
        );
        setData(results);
        return results;
      } catch (err) {
        setError(err.message);
        setData([]);
        return null;
      } finally {
        setLoading(false);
      }
    };

    return { mutate, data, loading, error };
  };
}

// Form Hooks
export const useGetForm = MakeGetRequest(getForm);
export const useUpdateForm = MakeUpdateRequest(updateForm);
export const useInsertForm = MakeUpdateRequest(insertForm);

// Project Hooks
export const useGetProjects = MakeGetRequest(getProjects);
export const useGetProject = MakeGetRequestWithParams(getProject);
export const useInsertProject = MakeUpdateRequest(insertProject);
export const useUpdateProject = MakeUpdateRequest(updateProject);
export const useBulkUpdateFieldsVisibility = MakeUpdateRequests(updateProjectFieldsVisibility);

// Links Hooks
export const useGetLinks = MakeGetRequest(getLinks);
export const useGetLink = MakeGetRequestWithParams(getLink);
export const useInsertLink = MakeUpdateRequest(insertLink);
export const useUpdateLink = MakeUpdateRequest(updateLink);

// Finance Hooks
export const useGetFinances = MakeGetRequest(getFinances);
export const useGetFinance = MakeGetRequestWithParams(getFinance);
export const useInsertFinance = MakeUpdateRequest(insertFinance);
export const useUpdateFinance = MakeUpdateRequest(updateFinance);
export const useDeleteFinance = MakeUpdateRequest(deleteFinance);

// Profile Hooks
export const useGetProfile = MakeGetRequest(getProfile);
export const useUpdateProfile = MakeUpdateRequest(updateProfile);