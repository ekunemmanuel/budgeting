document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-q');
  const answer = item.querySelector('.faq-a');

  question.addEventListener('click', () => {
    const isOpen = item.getAttribute('data-open') === 'true';

    document.querySelectorAll('.faq-item').forEach((other) => {
      other.setAttribute('data-open', 'false');
      other.querySelector('.faq-a').style.maxHeight = null;
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.setAttribute('data-open', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      question.setAttribute('aria-expanded', 'true');
    }
  });
});
