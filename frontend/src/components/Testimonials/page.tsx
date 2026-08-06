// Imports Principais
import Image from "next/image";
import Link from "next/link";

// Style Sheet CSS
import styles from "./testimonials.module.css";

// Icons
import { FiMoreHorizontal } from "react-icons/fi";

// Images
import Kon from "../../../public/kon.jpg";

function TestimonialsComponent() {
  const testimonials = [
    {
      name: "Rafael Gonçalves",
      text: `Fala cuzão, te considero pakas. Todos esses anos juntos foi uma
      prazer, que venham mais. Lorem ipsum dolor sit amet, consectetur
      adipiscing elit, sed do eiusmod tempor incididunt ut labore et
      dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
      sint occaecat cupidatat non proident, sunt in culpa qui officia
      deserunt mollit anim id est laborum.`,
      imageAlt: "Foto de perfil de Rafael Gonçalves",
    },
    {
      name: "Rika Get Set",
      text: `Fala cuzão, te considero pakas. Todos esses anos juntos foi uma
      prazer, que venham mais. Lorem ipsum dolor sit amet, consectetur
      adipiscing elit, sed do eiusmod tempor incididunt ut labore et
      dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat.`,
      imageAlt: "Foto de perfil de Rika Get Set",
    },
  ];

  return (
    <section aria-labelledby={styles.testimonialTitle}>
      <div className={styles.testimonialsContainer}>
        <h2 id={styles.testimonialTitle} className={styles.testimonialTitle}>
          Depoimentos ({testimonials.length})
        </h2>

        <div className={styles.testimonials}>
          {testimonials.map((testimonial, index) => (
            <div key={index}>
              <div className={styles.testimonial}>
                <Image
                  className={styles.testimonialImage}
                  alt={testimonial.imageAlt}
                  src={Kon}
                  width={100}
                  height={100}
                  priority
                />
                <div className={styles.testimonialContainer}>
                  <h3 className={styles.testimonialNameUsername}>
                    {testimonial.name}:
                  </h3>
                  <p className={styles.testimonialText}>{testimonial.text}</p>
                </div>
              </div>

              {index < testimonials.length - 1 && (
                <hr className={styles.testimonialHrFaded} />
              )}
            </div>
          ))}
        </div>

        <hr className={styles.testimonialHrFaded} />

        <Link
          className={styles.seeAllTestimonials}
          href={`/`}
          aria-label="Ver todos os depoimentos"
        >
          <span>Ver todos</span> <FiMoreHorizontal size={20} />
        </Link>
      </div>
    </section>
  );
}

export { TestimonialsComponent };
