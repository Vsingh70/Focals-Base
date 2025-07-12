'use client';
import { useState, useEffect, useCallback } from "react";
import DesktopBar from "../components/DesktopBar";
import List from "../components/Element/List";
import DeleteSelectedButton from "../components/Navbar/DeleteSelectedButton";
import DeletePopUpCard from "../components/Navbar/Filter/DeletePopUpCard";
import { useGetProjects, useGetLinks, useUpdateLink } from "@/utils/api";
import Toast from "../components/toast";

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

  const { data: forms, loading, error } = useGetProjects();
  const { data: links } = useGetLinks();
  const { mutate: updateLink } = useUpdateLink();

  // Sync API data to state
  useEffect(() => {
    if (forms?.data) {
      setProjects(forms.data);
      setFilteredProjects(forms.data);
    }
  }, [forms?.data]);

  // This will be called by the SearchBar (via DesktopBar)
  const handleSearchResults = useCallback((results) => {
    setFilteredProjects(results);
  }, []);

  const handleSelect = (id) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

  const handleDeleteSelected = async () => {
      try {
          // Delete selected projects
          await Promise.all(selected.map(async (id) => {
              await fetch(`/api/projects/delete-project?id=${id}`, {
                  method: 'DELETE',
              });
          }));

          // Update links to remove deleted project IDs from their fields.Projects.value array
          if (Array.isArray(links?.data)) {
              await Promise.all(
                  links.data.map(async (link) => {
                      const projectsArr = link?.fields?.Projects?.value;
                      if (Array.isArray(projectsArr)) {
                          const updatedProjects = projectsArr.filter(
                              projectId => !selected.includes(projectId)
                          );
                          if (updatedProjects.length !== projectsArr.length) {
                              await updateLink({
                                  id: link.id,
                                  fields: {
                                      ...link.fields,
                                      Projects: {
                                          ...link.fields.Projects,
                                          value: updatedProjects
                                      }
                                  }
                              });
                          }
                      }
                  })
              );
          }
          
          setProjects(prev => prev.filter(project => !selected.includes(project.id)));
          setFilteredProjects(prev => prev.filter(project => !selected.includes(project.id)));
          setSelected([]); // Clear selection after successful deletion
          setMessage("Projects deleted successfully");
          setShowToast(true);
      } catch (err) {
          setMessage(err.message);
          setShowToast(true);
      }
  };

  const NewDeleteButton = () => {
      return (
          <DeleteSelectedButton selected={selected} setShowDeletePopup={setShowDeletePopup}/>
      );
  }

  return (
    <div>
      <DesktopBar Title="Projects"
      Search={true}
      Filter={true}
      Add="true"
      AddText="+ Add Project"
      AddLink="/add"
      Input={projects}
      update={handleSearchResults}
      Delete={true}
      DeleteButton={NewDeleteButton}
      />
        <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center'}}>
          <DeletePopUpCard
                    trigger={showDeletePopup}
                    setTrigger={setShowDeletePopup}
                    onConfirm={handleDeleteSelected}
                />
                {showToast && (
                    <Toast 
                        Message={message} 
                        close={() => setShowToast(false)}
                        duration={2000} // Optional: custom duration
                    />
                )}
          <List list={filteredProjects}
          updatePath="/api/projects/update-project"
          fetchPath="/api/projects/get-project"
          selected={selected}
          setSelected={setSelected}
          handleSelect={handleSelect} 
          />
      </div>
    </div>
  );
}