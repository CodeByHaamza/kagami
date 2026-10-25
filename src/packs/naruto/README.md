<div align="center">

<img src="../../../docs/images/kata.svg" alt="Kata" width="700">

# 型 Kata

**Les signes de Naruto, reconnus à la caméra.**

*Un pack pour [Kagami](../../../README.md).*

</div>

---

> 印を結べ。
> *Forme les sceaux.*

Tu fais les signes devant ta webcam. Un YOLOX-Nano entraîné sur les 14 sceaux les
reconnaît, et le bon enchaînement lance l'un des **52 jutsus** : boule de feu, Chidori,
Rasengan, clones, invocations, mur de terre, Tsukuyomi, Amaterasu.

## 十四印 · Les quatorze signes

Les douze signes du zodiaque chinois, plus deux signes particuliers. Chaque kanji est
toujours accompagné de son nom : un kanji seul ne se lit pas quand on ne le connaît pas.

| | | | | | | |
| --- | --- | --- | --- | --- | --- | --- |
| 子 **Rat**<br><sub>Ne</sub> | 丑 **Bœuf**<br><sub>Ushi</sub> | 寅 **Tigre**<br><sub>Tora</sub> | 卯 **Lièvre**<br><sub>U</sub> | 辰 **Dragon**<br><sub>Tatsu</sub> | 巳 **Serpent**<br><sub>Mi</sub> | 午 **Cheval**<br><sub>Uma</sub> |
| 未 **Bélier**<br><sub>Hitsuji</sub> | 申 **Singe**<br><sub>Saru</sub> | 酉 **Oiseau**<br><sub>Tori</sub> | 戌 **Chien**<br><sub>Inu</sub> | 亥 **Sanglier**<br><sub>I</sub> | 祈 **Mains jointes**<br><sub>Gasshō</sub> | 壬 **Mizunoe**<br><sub>eau</sub> |

Le **Bélier** a un rôle à part : c'est le signe du **Kai** (解). Pris dans un genjutsu,
c'est lui qui te libère — comme dans l'œuvre.

## 忍術 · Les cinquante-deux jutsus

| Famille | Combien | Quelques-uns |
| --- | --- | --- |
| 火遁 **Katon** · feu | 6 | Gōkakyū, Hōsenka, Karyū Endan, Gōka Mekkyaku |
| 水遁 **Suiton** · eau | 7 | Suiryūdan (44 signes), Daibakufu, Kirigakure |
| 雷遁 **Raiton** · foudre | 3 | Chidori, Jinraisen, Kirin |
| 風遁 **Fūton** · vent | 7 | Daitoppa, Kamaitachi, Rasengan, Rasenshuriken |
| 土遁 **Doton** · terre | 4 | Doryūheki, Doryūdan, Doryūsō |
| 木遁 **Mokuton** · bois | 3 | Shichūrō, Jukai Kōtan |
| 忍術 **Ninjutsu** | 7 | Bunshin, Kawarimi, Shunshin, Kagemane |
| 口寄せ **Kuchiyose** | 3 | l'invocation du crapaud, Rashōmon |
| 幻術 **Genjutsu** | 2 | Narakumi, Jubaku Satsu |
| 封印術 **Fūinjutsu** | 2 | Shiki Fūjin, Fūja Hōin |
| 医療忍術 **Iryō** | 2 | Shōsen, scalpel de chakra |
| 瞳術 **Dōjutsu** | 5 | Tsukuyomi, Amaterasu, Susanoo, Kamui, Izanagi |

Le défi du pack reste le **Suiryūdan de Zabuza** : quarante-quatre signes d'affilée,
sans en rater un.

## Comment on joue

1. Mains bien visibles, à hauteur de poitrine, dans un endroit éclairé.
2. Tiens chaque signe une demi-seconde : un « toc » le valide.
3. Quelques jutsus n'ont qu'un signe : tiens-le 2,5 secondes.
4. Pris dans un genjutsu ? Fais le Bélier.

L'**encyclopédie** (📜) donne tous les enchaînements, et garde une photo de chaque signe
que tu réussis. Le mode **entraînement** t'en fait répéter un en te montrant le suivant.

## Sous le capot

| | |
| --- | --- |
| `donnees/` | les 14 signes, les 52 jutsus, les familles. Kanji et romaji seulement : les noms traduisibles sont dans `i18n/`. |
| `entree/` | le reconnaisseur YOLOX, et le prétraitement sorti en fonctions pures |
| `effets/` | les 52 effets, et la scène Three.js du Rasengan |
| `i18n/` | français et anglais, mêmes clés des deux côtés (un test le vérifie) |
| `manifeste.ts` | ce que le pack déclare au moteur |

Les enchaînements viennent de la [Narutopedia](https://naruto.fandom.com), sauf quelques
variantes tirées du dépôt du modèle de détection. Le Rasengan, le Rasenshuriken, Kirin et
les techniques du Sharingan n'ont pas de signes dans l'œuvre : leurs enchaînements sont
inventés pour l'appli, et marqués `source: "appli"` dans les données.

## Ce qui vient

Taijutsu au corps, armes et parchemins explosifs, mode arcade avec vagues et boss,
grades de l'Académie au Kage, modes ermite, Rinnegan. Voir la
[feuille de route](../../../README.md#feuille-de-route).

---

<div align="center">
<sub>NARUTO © Masashi Kishimoto / Shueisha. Projet de fan, non officiel, non commercial.</sub>
</div>
