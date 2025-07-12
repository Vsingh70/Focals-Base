import { useState, useEffect } from 'react';

// ...existing API functions...

// Form Hooks
export function useGetForm() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getForm()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useUpdateForm() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (form) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateForm(form);
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
}

export function useInsertForm() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await insertForm();
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
}

// Project Hooks
export function useGetProjects() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProjects()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useGetProject(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProject(id)
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

export function useInsertProject() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (project) => {
    setLoading(true);
    setError(null);
    try {
      const result = await insertProject(project);
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
}

export function useUpdateProject() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (project) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateProject(project);
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
}

export function useBulkUpdateFieldsVisibility() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (argsArray) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        argsArray.map(args => updateProjectFieldsVisibility(args))
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
}

// Links Hooks
export function useGetLinks() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLinks()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useGetLink(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getLink(id)
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

export function useInsertLink() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (link) => {
    setLoading(true);
    setError(null);
    try {
      const result = await insertLink(link);
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
}

export function useUpdateLink() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (link) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateLink(link);
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
}