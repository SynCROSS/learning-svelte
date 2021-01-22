export default function flash(element) {
  requestAnimationFrame(() => {
    element.style.transition = 'none';
    element.style.color = 'rgba(255,62,0,1)';
    element.style.backgroundColor = 'rgba(220,20,60,0.2)';

    setTimeout(() => {
      element.style.transition = 'color 1s, background 1s';
      element.style.color = '';
      element.style.backgroundColor = '';
    });
  });
}
