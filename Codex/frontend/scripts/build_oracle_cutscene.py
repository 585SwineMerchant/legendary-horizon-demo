import os
import subprocess
import shutil

def escape_text(text):
    # Escape colon and single quotes for ffmpeg drawtext
    return text.replace(":", "\\:").replace("'", "\\'")

def main():
    root_dir = r"C:\Antigravity local\LH\Video Game\Project Documents\Oracle Cut Scene\resolve-ready"
    out_file = r"C:\Antigravity local\LH\Video Game\oracle_cutscene_v1.mp4"
    
    # Fonts
    font_src = r"C:\Windows\Fonts\georgia.ttf"
    font_dst = os.path.join(root_dir, "georgia.ttf")
    if os.path.exists(font_src):
        shutil.copyfile(font_src, font_dst)
    
    images = [
        "oracle_chamber_wide.png",        # 0
        "02_scroll_closeup.png",          # 1
        "oracle_statue_glow.png",         # 2
        "oracle_vision_threads.png",      # 3
        "oracle_vision_glimpse.png",      # 4
        "oracle_convergence_tome.png"     # 5
    ]
    
    audio_base = os.path.join(root_dir, "audio")
    audios = [
        "oracle_ambient_base.mp3",        # 6 (ambient)
        "oracle_music_sting.mp3",         # 7 (sting)
        "oracle_rune_chime.mp3",          # 8 (chime)
        "oracle_tremor.mp3"               # 9 (tremor)
    ]
    
    cmd = ["ffmpeg", "-y"]
    
    # Input Images
    for img in images:
        cmd.extend(["-loop", "1", "-framerate", "24", "-i", os.path.join(root_dir, img)])
        
    # Input Audios
    cmd.extend(["-stream_loop", "-1", "-i", os.path.join(audio_base, audios[0])]) # Ambient
    cmd.extend(["-i", os.path.join(audio_base, audios[1])]) # Sting
    cmd.extend(["-i", os.path.join(audio_base, audios[2])]) # Chime
    cmd.extend(["-i", os.path.join(audio_base, audios[3])]) # Tremor

    filter_complex = []
    
    # Durations and frames
    # Shot 1: 5.0s
    filter_complex.append("[0:v]format=yuv420p,scale=1920x1080,zoompan=z='1.0+0.08*(in/120)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=120:s=1920x1080:fps=24,trim=duration=5.0,setpts=PTS-STARTPTS[vA]")
    
    # Shot 2: 8.25s
    filter_complex.append("[1:v]format=yuv420p,scale=1920x1080,zoompan=z='1.0+0.06*(in/198)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=198:s=1920x1080:fps=24,trim=duration=8.25,setpts=PTS-STARTPTS[vB]")
    
    # Shot 3: 9.25s (static)
    filter_complex.append("[2:v]format=yuv420p,scale=1920x1080,zoompan=z='1.0':d=222:s=1920x1080:fps=24,trim=duration=9.25,setpts=PTS-STARTPTS[vC]")
    
    # Shot 4a: 4.08s (static)
    filter_complex.append("[3:v]format=yuv420p,scale=1920x1080,zoompan=z='1.0':d=98:s=1920x1080:fps=24,trim=duration=4.08,setpts=PTS-STARTPTS[vD]")
    
    # Shot 4b: 5.25s (static)
    filter_complex.append("[4:v]format=yuv420p,scale=1920x1080,zoompan=z='1.0':d=126:s=1920x1080:fps=24,trim=duration=5.25,setpts=PTS-STARTPTS[vE]")
    
    # Shot 5: 6.25s
    filter_complex.append("[5:v]format=yuv420p,scale=1920x1080,zoompan=z='1.0+0.12*(in/150)':x='iw/2-(iw/zoom)/2':y='ih/2-(ih/zoom)/2':d=150:s=1920x1080:fps=24,trim=duration=6.25,setpts=PTS-STARTPTS[vF]")
    
    # Black: 3.05s
    filter_complex.append("color=c=black:s=1920x1080:d=3.05:r=24[vG]")
    
    # XFades
    filter_complex.append("[vA][vB]xfade=transition=fade:duration=0.25:offset=4.75[vAB]")
    filter_complex.append("[vAB][vC]xfade=transition=fade:duration=0.25:offset=12.75[vABC]")
    filter_complex.append("[vABC][vD]xfade=transition=fade:duration=0.08:offset=21.92[vABCD]")
    filter_complex.append("[vABCD][vE]xfade=transition=fade:duration=0.25:offset=25.75[vABCDE]")
    filter_complex.append("[vABCDE][vF]xfade=transition=fade:duration=0.25:offset=30.75[vABCDEF]")
    filter_complex.append("[vABCDEF][vG]xfade=transition=fade:duration=0.05:offset=36.95[vX]")
    
    # Texts
    # Text 1: 1s to 5s
    text1 = escape_text("The scroll hums in your hands...")
    draw1 = f"drawtext=fontfile=georgia.ttf:text='{text1}':fontcolor=0xd4a017:fontsize=52:x=(w-text_w)/2:y=(h-text_h)*0.75:enable='between(t,1,5)':alpha='if(lt(t,2),t-1,if(lt(t,4),1,5-t))'"
    
    # Text 2: 11s to 13s
    text2 = escape_text("Your signposts stir...")
    draw2 = f"drawtext=fontfile=georgia.ttf:text='{text2}':fontcolor=0xd4a017:fontsize=52:x=(w-text_w)/2:y=(h-text_h)*0.75:enable='between(t,11,13)':alpha='if(lt(t,11.5),(t-11)/0.5,if(lt(t,12.5),1,(13-t)/0.5))'"
    
    # Text 3: 24s to 29s
    text3 = escape_text("The threads of your fate converge...")
    draw3 = f"drawtext=fontfile=georgia.ttf:text='{text3}':fontcolor=0xd4a017:fontsize=52:x=(w-text_w)/2:y=(h-text_h)*0.75:enable='between(t,24,29)':alpha='if(lt(t,25),t-24,if(lt(t,28),1,29-t))'"
    
    filter_complex.append(f"[vX]{draw1},{draw2},{draw3}[vOut]")
    
    # Audio
    # Ambient: 6 (loop) -> -12dB
    filter_complex.append("[6:a]volume=-12dB[amb]")
    # Chime: 8 -> split 3, delay 6s, 8s, 10s
    filter_complex.append("[8:a]asplit=3[chA][chB][chC]")
    filter_complex.append("[chA]adelay=6000|6000[c1]")
    filter_complex.append("[chB]adelay=8000|8000[c2]")
    filter_complex.append("[chC]adelay=10000|10000[c3]")
    # Tremor: 9 -> delay 17s
    filter_complex.append("[9:a]adelay=17000|17000[tremor]")
    
    # Mix audio
    filter_complex.append("[amb][7:a][c1][c2][c3][tremor]amix=inputs=6:normalize=0:duration=longest,afade=t=out:st=37:d=3[aOut]")
    
    cmd.extend(["-filter_complex", ";".join(filter_complex)])
    cmd.extend(["-map", "[vOut]", "-map", "[aOut]"])
    cmd.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-t", "40", out_file])
    
    print("Running ffmpeg...")
    result = subprocess.run(cmd, cwd=root_dir, capture_output=True, text=True)
    if result.returncode != 0:
        print("FFMPEG ERROR:")
        print(result.stderr)
    else:
        print(f"Successfully generated {out_file}")

if __name__ == "__main__":
    main()
