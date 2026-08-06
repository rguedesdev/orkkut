"use client";

// Imports Principais
import { useState, useEffect, useContext, useRef } from "react";
import Image from "next/image";

// UserContext
import { UserContext } from "@/context/UserContext";

// Style Sheet CSS
import styles from "./navbar.module.css";

// Components
import { ThemeToggle } from "../ThemeToggle/page";

// Icons
import { CgProfile } from "react-icons/cg";
import { MdOutlineViewTimeline } from "react-icons/md";

import { RiUserCommunityLine } from "react-icons/ri";
import { TbHelpSquareRounded } from "react-icons/tb";

import { LiaUserFriendsSolid } from "react-icons/lia";

import { IoSearch } from "react-icons/io5";

import { RiArrowDownWideLine } from "react-icons/ri";

import { BsGear } from "react-icons/bs";
import { TbLogout } from "react-icons/tb";

// Images
import LogoLight from "../../../public/orkkut_logo1.png";
import LogoDark from "../../../public/orkkut_logo2.png";
import Kon from "../../../public/kon.jpg";

function Navbar() {
  // const authenticated = useContext(UserContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const Context = useContext(UserContext);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      forceUpdate((n) => n + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const userAuthenticated = Context?.userAuthenticated ?? false;

  useEffect(() => {
    setDropdownOpen(false);
  }, [userAuthenticated]);

  useEffect(() => {
    if (!dropdownOpen) return;

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setDropdownOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [dropdownOpen]);

  if (!Context) return null;
  const { authenticatedUser, logout } = Context;

  return (
    <header>
      <nav className={styles.navbar}>
        <Image
          className={styles.logo}
          src={
            typeof document !== "undefined" &&
            document.documentElement.getAttribute("data-theme") === "dark"
              ? LogoDark
              : LogoLight
          }
          alt="Logo"
          width={120}
          height={0}
          priority
        />

        {userAuthenticated === false ? (
          <ul>
            {/* <li className="nav-li">
            <RiHome3Line size={20} />
            <span>Home</span>
          </li> */}

            <li className={styles.navLi}>
              <RiUserCommunityLine size={20} />
              <span>Junte-se ao Orkkut</span>
            </li>

            {/* <li>
          <MdOutlinePermMedia size={20} />
          <span>Mídias</span>
        </li> */}

            <li className={styles.navLi}>
              <TbHelpSquareRounded size={22} />
              <span>Ajuda</span>
            </li>
          </ul>
        ) : (
          <>
            <ul>
              {/* <li className="nav-li">
              <RiHome3Line size={20} />
              <span>Home</span>
            </li> */}

              <li className={styles.navLi}>
                <CgProfile size={20} />
                <span>Perfil</span>
              </li>

              <li className={styles.navLi}>
                <MdOutlineViewTimeline size={20} />
                <span>Timeline</span>
              </li>

              <li className={styles.navLi}>
                <LiaUserFriendsSolid size={20} />
                <span>Amigos</span>
              </li>

              <li className={styles.navLi}>
                <RiUserCommunityLine size={20} />
                <span>Comunidades</span>
              </li>

              <li className={styles.navLi}>
                <TbHelpSquareRounded size={22} />
                <span>Ajuda</span>
              </li>
            </ul>
            <div className={styles.searchContainer}>
              <IoSearch className={styles.searchIcon} size={20} />
              <input type="search" placeholder="Buscar no Orkkut" />
            </div>
            <div className={styles.navProfileInfoContainer}>
              <div className={styles.navProfilePictureBorder}>
                <Image
                  className={styles.navProfilePicture}
                  src={authenticatedUser?.profile?.avatarImage?.url ?? Kon}
                  alt={`Foto de perfil de ${authenticatedUser?.name ?? "usuário autenticado"}`}
                  width={40}
                  height={40}
                  priority
                  unoptimized={Boolean(authenticatedUser?.profile?.avatarImage?.url)}
                />
              </div>
              <h3 className={styles.navNameUsername}>
                {authenticatedUser?.name ?? "Meu perfil"}
              </h3>

              {/* seta que abre/fecha dropdown */}
              <div className={styles.dropDownContainer} ref={dropdownRef}>
                <button
                  type="button"
                  className={styles.dropDownTrigger}
                  onClick={() => setDropdownOpen((open) => !open)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  aria-label="Abrir menu do perfil"
                >
                  <RiArrowDownWideLine className={styles.downArrow} size={25} />
                </button>

                {/* menu dropdown */}
                {dropdownOpen && <div className={`${styles.dropDownMenu} ${styles.show}`}>
                  <ul>
                    <li>
                      <BsGear size={20} />
                      <span>Configurações</span>
                    </li>

                    <li onClick={() => logout()}>
                      <TbLogout size={20} />
                      <span>Sair</span>
                    </li>
                  </ul>
                </div>}
              </div>
              <ThemeToggle />
            </div>
          </>
        )}
      </nav>
    </header>
  );
}

export { Navbar };
