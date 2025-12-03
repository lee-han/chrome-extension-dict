const tabs = document.querySelectorAll('.tab');
const iframes = document.querySelectorAll('iframe');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.target;
    
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    iframes.forEach(iframe => {
      iframe.classList.toggle('hidden', iframe.id !== target);
    });
  });
});
