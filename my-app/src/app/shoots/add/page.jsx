'use client'

import { useRouter } from "next/navigation";
import AddRow from "../../components/AddRow";

function parseContactInfoArray(info) {
  if (!info) return ["", "", ""];
  if (typeof info === "string") {
    try {
      const arr = JSON.parse(info);
      return Array.isArray(arr) ? arr.map(v => v ?? "") : ["", "", ""];
    } catch {
      return ["", "", ""];
    }
  }
  return Array.isArray(info) ? info.map(v => v ?? "") : ["", "", ""];
}

const defaultShoot = {
  date: "",
  client: "",
  genre: "",
  location: "",
  contact_info: ["", "", ""],
  edit_link: "",
  client_mood_board_link: "",
  notes: "",
  pay: null,
  expenses: null,
  paid: false,
  edited_and_returned: false,
};

export default function ShootDetailPage() {
  const router = useRouter();

  const fields = [
    {
      name: "date",
      label: "Date",
      type: "datetime-local",
      required: true
    },
    {
      name: "client",
      label: "Client",
      type: "text",
      required: true
    },
    {
      name: "genre",
      label: "Genre",
      type: "text",
      required: true
    },
    {
      name: "location",
      label: "Location",
      type: "text"
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Contact Email"
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      placeholder: "Contact Phone"
    },
    {
      name: "social",
      label: "Social",
      type: "text",
      placeholder: "Social Media Handle"
    },
    {
      name: "edit_link",
      label: "Edit Link",
      type: "text"
    },
    {
      name: "client_mood_board_link",
      label: "Client Mood Board Link",
      type: "text"
    },
    {
      name: "notes",
      label: "Notes",
      type: "text"
    },
    {
      name: "pay",
      label: "Pay",
      type: "number",
      step: "0.01",
      min: "0"
    },
    {
      name: "expenses",
      label: "Expenses",
      type: "number",
      step: "0.01",
      min: "0"
    },
    {
      name: "paid",
      label: "Paid",
      type: "checkbox"
    },
    {
      name: "edited_and_returned",
      label: "Edited and Returned",
      type: "checkbox"
    }
  ];

  const handleSuccess = (data) => {
    // Additional success handling if needed
    console.log('Shoot added:', data);
  };

  const transformData = (formData) => {
    // Transform the form data before sending to API
    const contactInfo = [
      formData.email || null,
      formData.phone || null,
      formData.social || null
    ];

    // Remove contact fields from final data
    const { email, phone, social, ...rest } = formData;

    // Transform date to ISO string
    const finalData = {
      ...rest,
      date: new Date(formData.date).toISOString(),
      contact_info: contactInfo,
      pay: formData.pay ? parseFloat(formData.pay) : null,
      expenses: formData.expenses ? parseFloat(formData.expenses) : null
    };

    return finalData;
  };

  return (
    <AddRow
      title="Shoots"
      apiEndpoint="/api/shoots/insert-shoots"
      fields={fields}
      defaultValues={defaultShoot}
      backUrl="/shoots"
      onSuccess={handleSuccess}
      transformData={transformData}
    />
  );
}