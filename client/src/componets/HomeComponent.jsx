import React from 'react';
import { Link } from 'react-router-dom';

const HomeComponent = () => {
    const user = localStorage.getItem('user_info'); 

    if(!user) {
        return (
            <div>
                <h3>you are not logged in</h3>
                <Link to='/account/login'>login page</Link>
            </div>
        )
    }
  return (
    <div>
      <h3>Welcome to home page</h3>
    </div>
  );
}

export default HomeComponent;
