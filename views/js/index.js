export function init(result) {
  document.getElementById('signup').onsubmit = () => {
    if (document.getElementById('password').value !== document.getElementById('confirm_password').value) {
      alert("Password and Confirm Password do not match.");
      return false
    }
    return true;
  }
}