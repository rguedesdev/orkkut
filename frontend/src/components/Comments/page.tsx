// Imports Principais
import Image from "next/image";

// Style Sheet CSS
import styles from "./comments.module.css";

// Imagens
import Kon from "../../../public/kon.jpg";

function Comments() {
  return (
    <section>
      <div className={styles.wrapper}>
        <ul className={styles.list} depth="0" style={{ "--depth": 0 }}>
          <li className="" style={{ "--nested": "true" }}>
            <div className={styles.comment}>
              <div className={styles.user} />
              <div>
                {/* body */}
                <div className={styles.comment__body}>
                  <p>
                    <strong>Ahmad Shadeed</strong>
                  </p>
                  <p>
                    I like that, looks so cool and steady. This is the way to
                    build such a high performant element in Javascript. I will
                    keep doing it.
                  </p>
                </div>
                {/* actions */}
                <div className={styles.comment__actions}>
                  <a href="#">Like</a>
                  <a href="#">Reply</a>
                </div>
              </div>
            </div>

            <ul className={styles.list} depth="1" style={{ "--depth": 1 }}>
              <li style={{}}>
                <div className={styles.comment}>
                  <div className={styles.user} />
                  <div>
                    {/* body */}
                    <div className={styles.comment__body}>
                      <p>
                        <strong>Ahmad Shadeed</strong>
                      </p>
                      <p>
                        I like that, looks so cool and steady. This is the way
                        to build such a high performant element in Javascript. I
                        will keep doing it.
                      </p>
                    </div>
                    {/* actions */}
                    <div className={styles.comment__actions}>
                      <a href="#">Like</a>
                      <a href="#">Reply</a>
                    </div>
                  </div>
                </div>
              </li>
              <li style={{ "--nested": "true" }}>
                <div className={styles.comment}>
                  <div className={styles.user} />
                  <div>
                    {/* body */}
                    <div className={styles.comment__body}>
                      <p>
                        <strong>Ahmad Shadeed</strong>
                      </p>
                      <p>I like that, loo I will keep doing it.</p>
                    </div>
                    {/* actions */}
                    <div className={styles.comment__actions}>
                      <a href="#">Like</a>
                      <a href="#">Reply</a>
                    </div>
                  </div>
                </div>

                <ul className={styles.list} depth="2" style={{ "--depth": 2 }}>
                  <li style={{}}>
                    <div className={styles.comment}>
                      <div className={styles.user} />
                      <div>
                        {/* body */}
                        <div className={styles.comment__body}>
                          <p>
                            <strong>Ahmad Shadeed</strong>
                          </p>
                          <p>
                            I like that, looks so cool and steady. This is the
                            way to build such a high performant element in
                            Javascript. I will keep doing it.
                          </p>
                        </div>
                        {/* actions */}
                        <div className={styles.comment__actions}>
                          <a href="#">Like</a>
                          <a href="#">Reply</a>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li style={{}}>
                    <div className={styles.comment}>
                      <div className={styles.user} />
                      <div>
                        {/* body */}
                        <div className={styles.comment__body}>
                          <p>
                            <strong>Ahmad Shadeed</strong>
                          </p>
                          <p>
                            I like that, looks so cool and steady. This is the
                            way to build such a high performant element in
                            Javascript. I will keep doing it.
                          </p>
                        </div>
                        {/* actions */}
                        <div className={styles.comment__actions}>
                          <a href="#">Like</a>
                          <a href="#">Reply</a>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
              <li style={{ "--nested": "true" }}>
                <div className={styles.comment}>
                  <div className={styles.user} />
                  <div>
                    {/* body */}
                    <div className={styles.comment__body}>
                      <p>
                        <strong>Ahmad Shadeed</strong>
                      </p>
                      <p>
                        I like that, looks so cool and steady. This is the way
                        to build such a high performant element in Javascript. I
                        will keep doing it.
                      </p>
                    </div>
                    {/* actions */}
                    <div className={styles.comment__actions}>
                      <a href="#">Like</a>
                      <a href="#">Reply</a>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </li>

          <li>
            <div className={styles.comment}>
              <div className={styles.user} />
              <div>
                {/* body */}
                <div className={styles.comment__body}>
                  <p>
                    <strong>Ahmad Shadeed</strong>
                  </p>
                  <p>
                    I like that, looks so cool and steady. This is the way to
                    build such a high performant element in Javascript. I will
                    keep doing it.
                  </p>
                </div>
                {/* actions */}
                <div className={styles.comment__actions}>
                  <a href="#">Like</a>
                  <a href="#">Reply</a>
                </div>
              </div>
            </div>
          </li>

          <li>
            <div className={styles.comment}>
              <div className={styles.user} />
              <div>
                {/* body */}
                <div className={styles.comment__body}>
                  <p>
                    <strong>Ahmad Shadeed</strong>
                  </p>
                  <p>
                    I like that, looks so cool and steady. This is the way to
                    build such a high performant element in Javascript. I will
                    keep doing it.
                  </p>
                </div>
                {/* actions */}
                <div className={styles.comment__actions}>
                  <a href="#">Like</a>
                  <a href="#">Reply</a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}

export { Comments };
