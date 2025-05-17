import styles from './signup.module.css'

export default function home(){
  return (
    <div className={styles.container}>

      <form className={styles.input_boxes}>
        <div className={styles.form_group}>
        <label>Name</label>
        <input name="name"/>

        </div>
        <div className={styles.form_group}>

        <label>E-mail</label>
        <input name="email"/>
        </div>
        <div className={styles.form_group}>

        <label>Password</label>
        <input name="password"/>
        </div>

        <button> Submit </button>
      </form>
    </div>
  );
  
} 