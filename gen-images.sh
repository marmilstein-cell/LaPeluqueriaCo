#!/bin/bash
# BARDOS — generación de activos fotográficos AI (v2: concurrencia 2 + reintentos)
cd /home/z/my-project
mkdir -p public/images/raw gen-logs
rm -f gen-logs/status.txt

STYLE="black and white editorial fashion photography, direct on-camera flash, hard shadows, very high contrast, heavy film grain, 35mm film, avant-garde barbering magazine aesthetic, no text, no watermark"

gen_one() {
  name="$1"; size="$2"; prompt="$3"
  if [ -s "public/images/raw/$name.png" ]; then echo "SKIP $name" >> gen-logs/status.txt; return 0; fi
  for attempt in 1 2 3 4; do
    if z-ai image -p "$prompt, $STYLE" -o "public/images/raw/$name.png" -s "$size" > "gen-logs/$name.log" 2>&1; then
      echo "OK $name (attempt $attempt)" >> gen-logs/status.txt
      return 0
    fi
    # 429 o error → backoff creciente
    sleep $((attempt * 12))
  done
  echo "FAIL $name" >> gen-logs/status.txt
  return 1
}

run2() { # corre de a 2
  gen_one "$@" &
}

# --- pares secuencialmente, de a 2 ---
run2 hero-portrait 864x1152 "Close-up portrait of a young man with a freshly barbered sharp fade haircut and short dark hair, intense direct gaze into camera, plain black t-shirt, standing against a dark concrete wall with hard shadow, confident attitude"
run2 artist-santi 864x1152 "Portrait of a male barber in his 30s with slicked-back dark hair and trimmed mustache, wearing a black leather barber apron over black shirt, arms crossed, vintage silver scissors in hand, direct confident gaze"
wait
run2 artist-valo 864x1152 "Portrait of a heavily tattooed male barber with a full dark beard and shaved head, wearing a black work apron, holding vintage metal hair clippers, intense gaze into camera"
run2 artist-nico 864x1152 "Portrait of a young female barber with bleached short buzzcut hair, multiple ear piercings, sharp jawline, wearing black shirt and leather apron, holding a comb, confident direct gaze"
wait
run2 artist-rama 864x1152 "Portrait of an older distinguished male barber in his 50s with gray hair combed back and salt-and-pepper stubble, deep wrinkles, black apron, calm intense gaze into camera"
run2 client-older 864x1152 "Portrait of an elegant man in his 60s with white hair freshly cut in a classic style and clean shave, black shirt, dignified direct gaze, hard shadow on wall behind"
wait
run2 client-curly 864x1152 "Portrait of a young man with voluminous curly hair and a sharp defined beard line-up, looking slightly off camera with attitude, black tank top"
run2 craft-clippers 1024x1024 "Extreme close-up macro photograph of professional hair clippers cutting dark hair at a fade line, tiny cut hair fragments flying mid-air, barber's tattooed hand gripping the machine"
wait
run2 craft-scissors 1024x1024 "Extreme close-up of professional barber scissors mid-cut through dark hair, precise steel blades, barber fingers with ring, shallow depth of field"
run2 craft-razor 1024x1024 "Close-up of a straight razor shaving a client's cheek covered in white shaving foam, the blade sliding, extreme detail"
wait
run2 craft-foam 1024x1024 "Macro photograph of a shaving brush whipping white shaving foam in a battered metal bowl, dramatic side light, foam texture in extreme detail"
run2 craft-fade 1024x1024 "Extreme macro photograph of the transition line of a fresh skin fade haircut, skin blending into dark hair texture, barber's clipper guard visible at edge of frame"
wait
run2 space-wide 1440x720 "Wide interior shot of a dark brutalist barbershop, black concrete walls, row of vintage chrome and black leather barber chairs facing large mirrors with warm round light bulbs, moody atmosphere"
run2 space-chair 864x1152 "Detail photograph of a vintage barber chair in black cracked leather and aged chrome metal, dramatic side light, dark barbershop background out of focus"
wait
run2 space-mirror 1024x1024 "Photograph of a large round barbershop mirror framed with warm light bulbs, reflection of an empty barber chair and tools scattered on a shelf, dark walls"
run2 space-night 1344x768 "Night photograph of a barbershop storefront window glowing warm from inside a dark empty street, silhouette of barber chairs and mirrors inside, cinematic mood"
wait
run2 service-cut 1024x1024 "Over-the-shoulder photograph of a barber cutting a seated client's hair with scissors and comb, view through the mirror, client's fresh sharp haircut visible"
run2 service-beard 1024x1024 "Close-up photograph of a barber sculpting a client's dark beard with a precision trimmer, razor-sharp line-up on the cheek, focused hands"
wait
run2 service-color 1024x1024 "Close-up photograph of gray-blending hair color being applied to a man's hair with a tint brush and bowl, barber's gloved hands, editorial beauty photography"
run2 service-treatment 1024x1024 "Close-up photograph of a hot towel treatment wrapped over a reclined man's face, steam rising, dark barbershop background, serene"
wait
run2 service-ritual 1024x1024 "Cinematic photograph of a black towel draped over a man's shoulders in a barber chair, white shaving foam on his neck line, barber's hands finishing the line with a straight razor, dramatic dark scene"
run2 og-cover 1344x768 "Cinematic wide shot of a barber silhouette cutting hair in a dark barbershop, single hard flash light from the side, smoke haze, silhouette of chrome chair, dark moody editorial"
wait

echo "=== FINAL ===" >> gen-logs/status.txt
sort gen-logs/status.txt | uniq -c >> gen-logs/status.txt
cat gen-logs/status.txt
