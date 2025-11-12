import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x: number; y: number; vx: number; vy: number }[] = [];
    const mouse = { x: 0, y: 0 };
    const numStars = 100;
    const connectionDistance = 150;

    // Create stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      stars.forEach((star, i) => {
        // Connect to mouse
        const distToMouse = Math.hypot(mouse.x - star.x, mouse.y - star.y);
        if (distToMouse < connectionDistance) {
          ctx.strokeStyle = `rgba(0, 0, 0, ${1 - distToMouse / connectionDistance})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Connect to other stars
        for (let j = i + 1; j < stars.length; j++) {
          const dist = Math.hypot(stars[j].x - star.x, stars[j].y - star.y);
          if (dist < connectionDistance) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * (1 - dist / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-background/95 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-4xl animate-fade-in">
          <h1 className="font-montserrat font-extralight text-7xl md:text-8xl lg:text-9xl tracking-wider text-foreground">
            ELEVATE
          </h1>
          <p className="font-montserrat font-light text-xl md:text-2xl lg:text-3xl tracking-wide text-muted-foreground">
            Your Workforce Management
          </p>
          
          <div className="pt-8 space-y-4">
            <p className="font-montserrat font-extralight text-base md:text-lg tracking-wide text-muted-foreground max-w-2xl mx-auto">
              Experience the future of employee management with our comprehensive platform.
              Streamlined operations, powerful analytics, and intuitive design.
            </p>
          </div>

          <div className="pt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="font-montserrat font-light tracking-wide group"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="lg"
              className="font-montserrat font-light tracking-wide"
            >
              View Demo
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="font-montserrat font-extralight text-sm tracking-widest text-muted-foreground/60">
            PRECISION • EFFICIENCY • EXCELLENCE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
