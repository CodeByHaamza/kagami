<div align="center">

<img src="../../../docs/images/kata.svg" alt="Kata — les signes de Naruto, reconnus à la caméra" width="700">

**印を結べ。** · *Forme les sceaux.*

*Un pack pour [**Kagami**](../../../README.md).*

<img src="https://img.shields.io/badge/signes-14-e8963c?style=flat-square" alt="14 signes">
<img src="https://img.shields.io/badge/jutsus-52-ff8c1a?style=flat-square" alt="52 jutsus">
<img src="https://img.shields.io/badge/effets-52-e8440f?style=flat-square" alt="52 effets">
<img src="https://img.shields.io/badge/langues-FR%20%C2%B7%20EN-9a7aff?style=flat-square" alt="français et anglais">

</div>

---

Tu fais les signes devant ta webcam. Un YOLOX-Nano entraîné sur les 14 sceaux les
reconnaît, et le bon enchaînement lance l'un des **52 jutsus** : boule de feu, Chidori,
Rasengan, clones, invocations, mur de terre, Tsukuyomi, Amaterasu.

<div align="center">

### 火遁・豪火球の術

<img src="../../../docs/images/enchainement.svg" alt="L'enchaînement de la boule de feu suprême : Serpent, Bélier, Singe, Sanglier, Cheval, Tigre" width="660">

<sub>Six signes à la suite, chacun tenu une demi-seconde. Le curseur avance quand le modèle valide.</sub>

</div>

## 十四印 · Les quatorze signes

Les douze signes du zodiaque chinois, plus deux signes particuliers.

<div align="center">
<img src="../../../docs/images/signes-reference.png" alt="Planche de référence des douze signes du zodiaque" width="520">
</div>

> **Sur cette planche :** c'est une référence trouvée en ligne, d'origine inconnue, qui
> sert à montrer les positions. Elle ne couvre que les douze signes du zodiaque — il
> manque 祈 Gasshō et 壬 Mizunoe — et elle est **destinée à être remplacée** par nos
> propres visuels, en même temps que les silhouettes d'ennemis (plan 5).

| | | | | | | |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 |
| **Rat**<br><sub>Ne</sub> | **Bœuf**<br><sub>Ushi</sub> | **Tigre**<br><sub>Tora</sub> | **Lièvre**<br><sub>U</sub> | **Dragon**<br><sub>Tatsu</sub> | **Serpent**<br><sub>Mi</sub> | **Cheval**<br><sub>Uma</sub> |
| 未 | 申 | 酉 | 戌 | 亥 | 祈 | 壬 |
| **Bélier**<br><sub>Hitsuji</sub> | **Singe**<br><sub>Saru</sub> | **Oiseau**<br><sub>Tori</sub> | **Chien**<br><sub>Inu</sub> | **Sanglier**<br><sub>I</sub> | **Mains jointes**<br><sub>Gasshō</sub> | **Mizunoe**<br><sub>eau</sub> |

Le **Bélier** a un rôle à part : c'est le signe du **Kai** (解). Pris dans un genjutsu,
c'est lui qui te libère — comme dans l'œuvre. C'est aussi le geste le plus reconnaissable
de la série : deux doigts dressés devant le visage, le **sceau de l'affrontement**.

> **Et le sceau en croix de Naruto ?** Celui du Kage Bunshin, deux mains croisées en
> croix, n'est **pas reconnu** : le modèle a été entraîné sur ces quatorze classes et
> sur aucune autre. L'ajouter demanderait de réentraîner le détecteur. Le `bunshin` du
> catalogue part donc de ses vrais sceaux canon — 未 Bélier, 巳 Serpent, 寅 Tigre.

## 性質変化 · Le cycle élémentaire

Il ne sert pas encore : il arrive avec le mode arcade, où chaque ennemi aura une
affinité et où taper avec le bon élément fera toute la différence.

<div align="center">
<img src="../../../docs/images/cycle.svg" alt="Le cycle élémentaire : Feu bat Vent, Vent bat Foudre, Foudre bat Terre, Terre bat Eau, Eau bat Feu" width="380">
</div>

## 忍術 · Les cinquante-deux jutsus

| Famille | Combien | Quelques-uns |
| --- | :---: | --- |
| 火遁 **Katon** · feu | 6 | Gōkakyū · Hōsenka · Karyū Endan · Gōka Mekkyaku |
| 水遁 **Suiton** · eau | 7 | Suiryūdan **(44 signes)** · Daibakufu · Kirigakure |
| 雷遁 **Raiton** · foudre | 3 | Chidori · Jinraisen · Kirin |
| 風遁 **Fūton** · vent | 7 | Daitoppa · Kamaitachi · Rasengan · Rasenshuriken |
| 土遁 **Doton** · terre | 4 | Doryūheki · Doryūdan · Doryūsō |
| 木遁 **Mokuton** · bois | 3 | Shichūrō · Jukai Kōtan |
| 忍術 **Ninjutsu** | 7 | Bunshin · Kawarimi · Shunshin · Kagemane |
| 口寄せ **Kuchiyose** | 3 | l'invocation du crapaud · Rashōmon |
| 幻術 **Genjutsu** | 2 | Narakumi · Jubaku Satsu |
| 封印術 **Fūinjutsu** | 2 | Shiki Fūjin · Fūja Hōin |
| 医療忍術 **Iryō** | 2 | Shōsen · scalpel de chakra |
| 瞳術 **Dōjutsu** | 5 | Tsukuyomi · Amaterasu · Susanoo · Kamui · Izanagi |

Le défi du pack reste le **Suiryūdan de Zabuza** : quarante-quatre signes d'affilée,
sans en rater un.

## Comment on joue

1. Mains bien visibles, à hauteur de poitrine, dans un endroit éclairé.
2. Tiens chaque signe une demi-seconde : un « toc » le valide.
3. Quelques jutsus n'ont qu'un signe : tiens-le 2,5 secondes.
4. Pris dans un genjutsu ? Fais le Bélier.

L'**encyclopédie** 📜 donne tous les enchaînements et garde une photo de chaque signe que
tu réussis. Le mode **entraînement** t'en fait répéter un en te montrant le suivant.

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
