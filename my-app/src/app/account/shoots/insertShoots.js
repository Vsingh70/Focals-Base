'use server'
//TODO NOT DONE NOT FUNCTIONAL, DONT TEST
export async function insert_shoots(formData, supabase, user) {
  const insert_data = {
    date: formData.get('date'),
    time: formData.get('time'),
    client: formData.get('client'),
    genre: formData.get('genre'),
    editLink: formData.get('editLink'),
    clientMoodBoardLink: formData.get('clientMoodBoardLink'),
    location: formData.get('location'),
    notes: formData.get('notes'),
    contactinfo: formData.get('contactinfo'),
    finishedEditing: formData.get('finishedEditing'),
    pay: formData.get('pay'),
    paid: formData.get('paid'),
    
  }

  const { data, error} = await supabase
  .from("shoots")
  .insert([
    insert_data
  ]);

  if(error){
    alert("you inserted wrong somehow")
    console.log(error)
  }
}