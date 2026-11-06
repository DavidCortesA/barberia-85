import { LogoMark } from "@/components/brand/logo-mark";

/**
 * Se ejecuta durante el parseo del HTML, antes de pintar: si el visitante ya
 * vio la intro en esta sesión, la oculta al instante (sin parpadeo).
 */
const seenScript = `try{if(sessionStorage.getItem("85-intro")){document.documentElement.classList.add("intro-seen")}else{sessionStorage.setItem("85-intro","1")}}catch(e){}`;

/**
 * Pantalla de carga: el logo se dibuja trazo a trazo y la cortina sube.
 * Todo con CSS (globals.css, sección "Pantalla de carga"): no espera a que
 * hidrate React y se retira sola aunque el JavaScript falle. Una vez por
 * sesión; desactivada con `prefers-reduced-motion`.
 */
export function IntroLoader() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: seenScript }} />
      <div className="intro" aria-hidden="true">
        <div className="intro-inner">
          <LogoMark animated className="w-[min(78vw,440px)]" title="" />
          <div className="intro-bar" />
        </div>
      </div>
    </>
  );
}
